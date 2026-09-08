/**
 * Course domain store — hydrates from ICourseRepository.
 */
import { createAsyncStore, type AsyncStore } from './createAsyncStore';
import { getRepositories } from './registry';
import type { Course } from '../domain/model/Course';

export type CourseStore = AsyncStore<Course>;

/** Singleton bound to the registered ICourseRepository. */
export const useCourseStore = createAsyncStore<Course>('course', () => getRepositories().course);

/** Domain selector: courses belonging to a semester. */
export function selectCoursesBySemester(courses: Course[], semesterId: string): Course[] {
  return courses.filter((course) => course.semesterId === semesterId);
}

export default useCourseStore;