import { useEffect, useState } from "react";
import { listTeams } from "./api/teams";

// One fetch per page load shared by every consumer; the catalog rarely
// changes mid-session and a failed fetch retries on next mount.
let imagesPromise = null;

function fetchTeamImages() {
  if (!imagesPromise) {
    imagesPromise = listTeams({ limit: 5000 })
      .then((teams) => {
        const byNumber = {};
        for (const team of teams) {
          if (team.data && team.data.image_url) {
            byNumber[String(team.team_number)] = team.data.image_url;
          }
        }
        return byNumber;
      })
      .catch((err) => {
        imagesPromise = null;
        throw err;
      });
  }
  return imagesPromise;
}

/**
 * Map of team number (string) -> robot photo URL from /api/teams.
 * Empty object until the fetch resolves; teams without a photo are absent.
 */
export function useTeamImages() {
  const [images, setImages] = useState({});
  useEffect(() => {
    let alive = true;
    fetchTeamImages()
      .then((byNumber) => {
        if (alive) setImages(byNumber);
      })
      .catch((err) => console.error("team images fetch failed", err));
    return () => {
      alive = false;
    };
  }, []);
  return images;
}
