export function normalizeTraineeNameSearch(value: string) {
  return value.trim().toLowerCase();
}

export function traineeNameMatchesSearch(name: string, searchQuery: string) {
  const normalizedSearch = normalizeTraineeNameSearch(searchQuery);
  if (!normalizedSearch) return true;
  return name.toLowerCase().includes(normalizedSearch);
}

export function filterTraineesByNameAndIds<T extends { id: string; name: string }>(
  trainees: T[],
  searchQuery: string,
  excludeIds: string[] = [],
) {
  const excludeSet = new Set(excludeIds);
  return trainees.filter(
    (trainee) =>
      !excludeSet.has(trainee.id) && traineeNameMatchesSearch(trainee.name, searchQuery),
  );
}
