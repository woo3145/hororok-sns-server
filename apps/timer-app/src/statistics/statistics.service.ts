import { StudyRecord } from '@app/database/typeorm/entities/study-record.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { endOfDay, startOfDay } from 'date-fns';
import { Between, Repository } from 'typeorm';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(StudyRecord)
    private readonly studyRecordRepository: Repository<StudyRecord>,
  ) {}

  async getDailyStatistics(memberId: string, date: string): Promise<any> {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(startDate.getDate() + 1);

    const records = await this.studyRecordRepository.find({
      where: {
        member: { member_id: memberId },
        start_time: Between(startDate, endDate),
      },
    });

    const dailySummary = records.reduce(
      (acc, record) => {
        if (!record.end_time) return acc;
        const duration =
          (record.end_time.getTime() - record.start_time.getTime()) / 1000;
        acc.totalSeconds += duration;
        return acc;
      },
      { date: date, totalSeconds: 0 },
    );

    return dailySummary;
  }
  async getMonthlyStatistics(
    memberId: string,
    year: number,
    month: number,
  ): Promise<any> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // 해당 월의 마지막 날

    const records = await this.studyRecordRepository.find({
      where: {
        member: { member_id: memberId },
        start_time: Between(startOfDay(startDate), endOfDay(endDate)),
      },
    });

    const monthlyTotal = records.reduce((acc, record) => {
      if (!record.end_time) return acc;
      const duration =
        (record.end_time.getTime() - record.start_time.getTime()) / 1000;
      return acc + duration;
    }, 0);

    return {
      month,
      year,
      totalSeconds: monthlyTotal,
    };
  }

  async getHeatMapData(
    memberId: string,
    start: string,
    end: string,
  ): Promise<any> {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const records = await this.studyRecordRepository.find({
      where: {
        member: { member_id: memberId },
        start_time: Between(startOfDay(startDate), endOfDay(endDate)),
      },
    });

    // 날짜별 총 학습 시간 계산
    const dailyTotals = records.reduce((acc, record) => {
      const dateKey = record.start_time.toISOString().split('T')[0];
      if (!record.end_time) return acc;
      const duration =
        (record.end_time.getTime() - record.start_time.getTime()) / 1000;
      acc[dateKey] = (acc[dateKey] || 0) + duration;
      return acc;
    }, {});

    // 배열 형태로 변환하여 반환
    return Object.entries(dailyTotals).map(([date, totalSeconds]) => ({
      date,
      totalSeconds,
    }));
  }
}
