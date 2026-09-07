/**
 * Helper to award XP to logged-in student for interactive activities.
 */
export async function awardStudentXp(
  token: string,
  activity: "flashcard" | "dictionary" | "grammar" | "quiz" | "assignment",
  customAmount?: number,
): Promise<{ ok: boolean; addedXp: number; newXp: number; message: string } | null> {
  if (!token) return null
  try {
    const res = await fetch("/api/lms/xp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ activity, amount: customAmount }),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
