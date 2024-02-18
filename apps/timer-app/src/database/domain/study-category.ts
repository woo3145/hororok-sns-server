import { Member } from './member';
import { StudyRecord } from './study-record';

export class StudyCategory {
  study_category_id: number;
  subject: string;
  color: string;
  member?: Member;
  study_records?: StudyRecord[];

  deleted_at: Date;
}