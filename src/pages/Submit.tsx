import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { currentScoutCanUseAuto, isPracticeSession } from "../utils/autoAccess";

function Submit() {
  const getDefaultReview = (): string =>
    currentScoutCanUseAuto() || isPracticeSession()
      ? "Good Auto"
      : "Good Teleop";

  const parseStoredReview = (): string | null => {
    const stored = localStorage.getItem("submit_review");
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      if (typeof parsed === "string") {
        return parsed.trim().length > 0 ? parsed : null;
      }
      if (Array.isArray(parsed)) {
        const firstReview = parsed.find(
          (value): value is string =>
            typeof value === "string" && value.length > 0,
        );
        return firstReview ?? null;
      }
    } catch {
      // Backward compatibility: previous versions stored a plain string.
    }
    return stored.trim().length > 0 ? stored : null;
  };

  const navigate = useNavigate();
  const [submitMessage, setSubmitMessage] = useState<string>("");
  const [backupMessage, setBackupMessage] = useState<string>("");
  const [selectedReview, setSelectedReview] = useState<string>(
    () => parseStoredReview() ?? getDefaultReview(),
  );

  useEffect(() => {
    if (
      window.location.hostname !== "localhost" &&
      localStorage.getItem("profile_is_signed_in") !== "true" &&
      !isPracticeSession()
    ) {
      navigate("/profile");
    }
  }, [navigate]);
  const toggleReview = (value: string) => {
    setSelectedReview((prev) => {
      const next = prev === value ? getDefaultReview() : value;
      localStorage.setItem("submit_review", JSON.stringify(next));
      return next;
    });
  };
  const resetScoutingData = () => {
    const keysToClear = [
      // Prematch
      "prematch_match_num",
      "prematch_team_num",
      "prematch_alliance",
      "prematch_orient",
      "prematch_position",
      "prematch_no_show",
      // Auto
      "auto_climb_selection",
      "auto_pass_count",
      "auto_score_count",
      "auto_pass_seconds",
      "auto_score_seconds",
      "auto_human_player_count",
      "auto_depot_count",
      "auto_top_left_count",
      "auto_middle_left_count",
      "auto_bottom_left_count",
      "auto_top_right_count",
      "auto_middle_right_count",
      "auto_bottom_right_count",
      "auto_button_times",
      // Teleop (legacy + v2 + v3)
      "teleop_checked",
      "teleop_pass_or_score",
      "teleop_pass_or_score_history",
      "teleop_trench_count",
      "teleop_bump_count",
      "teleop_hub_state",
      "teleop_hub_state_history",
      "teleop_button_times",
      "teleop_pass_time",
      "teleop_score_time",
      "teleopv2_button_times",
      // Endgame
      "endgame_climb",
      "endgame_climb_status",
      "endgame_climb_level",
      "endgame_climb_type",
      "endgame_shoot_while_climb",
      "endgame_buddy_climb",
      // Submit page state
      "submit_review",
    ];

    keysToClear.forEach((key) => localStorage.removeItem(key));
  };

  const buildPayload = () => {
    const rawButtonTimesV2 =
      localStorage.getItem("teleopv2_button_times") ?? "{}";
    const buttonTimesV2 = (() => {
      try {
        return JSON.parse(rawButtonTimesV2) as Record<string, number>;
      } catch {
        return {};
      }
    })();
    const rawAutoButtonTimes = localStorage.getItem("auto_button_times") ?? "";
    const autoButtonKeys = [
      "auto_human_player_count",
      "auto_depot_count",
      "auto_top_left_count",
      "auto_middle_left_count",
      "auto_bottom_left_count",
      "auto_top_right_count",
      "auto_middle_right_count",
      "auto_bottom_right_count",
    ];
    const autoButtonTimesText = rawAutoButtonTimes
      .split("\n")
      .map((line) => line.split("\t")[0]?.trim())
      .filter(
        (key): key is string => Boolean(key) && autoButtonKeys.includes(key),
      )
      .join("\n");
    const v2Score = Number(buttonTimesV2.score ?? 0);
    const v2Pass = Number(buttonTimesV2.pass ?? 0);
    const v2Defense = Number(buttonTimesV2.defense ?? 0);
    const v2Herd = Number(buttonTimesV2.herd ?? 0);
    const storedEndgameStatus =
      localStorage.getItem("endgame_climb_status") ?? "None";
    const endgameResult =
      storedEndgameStatus === "Success"
        ? "Successful"
        : storedEndgameStatus === "Failed"
          ? "Failed"
          : "Not Attempted";
    const endgameLevel = localStorage.getItem("endgame_climb_level") ?? "";
    const storedClimbType = localStorage.getItem("endgame_climb_type") ?? "";
    const endgameTowerPosition =
      storedClimbType === "Center"
        ? "Center of Tower"
        : storedClimbType === "Side"
          ? "Side of Tower"
          : "";
    const reviewText = selectedReview;
    const basePayload = {
      scout_name: localStorage.getItem("profile_scout_name") ?? "",
      session_type: localStorage.getItem("profile_session_type") ?? "",
      is_signed_in: localStorage.getItem("profile_is_signed_in") === "true",
      match_num: localStorage.getItem("prematch_match_num") ?? "",
      team_num: localStorage.getItem("prematch_team_num") ?? "",
      alliance: localStorage.getItem("prematch_alliance") ?? "red",
      orientation: localStorage.getItem("prematch_orient") ?? "",
      position: localStorage.getItem("prematch_position") ?? "",
      prematch_no_show: localStorage.getItem("prematch_no_show") === "true",
      review: reviewText,
      auto_climb_selection: localStorage.getItem("auto_climb_selection") ?? "",
      auto_pass_count: Number(localStorage.getItem("auto_pass_count") ?? "0"),
      auto_score_count: Number(localStorage.getItem("auto_score_count") ?? "0"),
      auto_pass_seconds: Number(
        localStorage.getItem("auto_pass_seconds") ?? "0",
      ),
      auto_score_seconds: Number(
        localStorage.getItem("auto_score_seconds") ?? "0",
      ),
      auto_button_times: autoButtonTimesText,
      climb: localStorage.getItem("endgame_climb") ?? "None",
      endgame_result: endgameResult,
      endgame_level: endgameLevel,
      endgame_tower_position: endgameTowerPosition,
      shoot_while_climb:
        localStorage.getItem("endgame_shoot_while_climb") === "true",
      buddy_climb: localStorage.getItem("endgame_buddy_climb") === "true",
    };

    return {
      ...basePayload,
      v2_score: v2Score,
      v2_pass: v2Pass,
      v2_defense: v2Defense,
      v2_herd: v2Herd,
    };
  };

  const copyTextToClipboard = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (!success) {
      throw new Error("Clipboard copy failed.");
    }
  };

  const handleBackupSubmit = async () => {
    try {
      const payload = buildPayload();
      const formattedPayload = JSON.stringify(payload, null, 2);
      await copyTextToClipboard(formattedPayload);
      setBackupMessage("Backup copied to clipboard.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to copy backup.";
      setBackupMessage(`Backup failed: ${message}`);
    }
  };

  const handleSubmit = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const tableName =
      import.meta.env.VITE_SUPABASE_TABLE ?? "scouting_submissions";

    if (!supabaseUrl || !supabaseAnonKey) {
      setSubmitMessage("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
      return;
    }

    const payload = buildPayload();

    setSubmitMessage("Submitting...");
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}`, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setSubmitMessage(`Submit failed: ${errorText}`);
        return;
      }

      resetScoutingData();
      const nextDefault = getDefaultReview();
      setSelectedReview(nextDefault);
      localStorage.setItem("submit_review", JSON.stringify(nextDefault));
      setSubmitMessage("Submitted to Supabase.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setSubmitMessage(`Submit failed: ${message}`);
    }
  };

  return (
    <div
      style={{
        margin: "0",
        padding: "0rem",
        marginTop: "2rem",
        maxWidth: "100%",
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        overflowX: "hidden",
        overflowY: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          marginTop: "1rem",
          marginBottom: "5rem",
          padding: "0 0.5rem",
          width: "100%",
          flexWrap: "wrap",
        }}
      >
        <h1>Submit</h1>
      </div>
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          alignItems: "center",
        }}
      >
        <button
          style={{
            backgroundColor: "#58b0b3",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "500",
            padding: "0.75rem 1.2rem",
            cursor: "pointer",
            transition: "background 0.2s",
            width: "100%",
            height: "60px",
            fontSize: "1.1rem",
            opacity: selectedReview === "Bad Auto" ? 0.6 : 1,
          }}
          onClick={() => toggleReview("Bad Auto")}
          onMouseEnter={(e) => {
            if (selectedReview !== "Bad Auto")
              e.currentTarget.style.backgroundColor = "#3a8d8f";
          }}
          onMouseLeave={(e) => {
            if (selectedReview !== "Bad Auto")
              e.currentTarget.style.backgroundColor = "#58b0b3";
          }}
        >
          Bad Auto
        </button>
        <button
          style={{
            backgroundColor: "#766dfc",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "500",
            padding: "0.75rem 1.2rem",
            cursor: "pointer",
            transition: "background 0.2s",
            width: "100%",
            height: "60px",
            fontSize: "1.1rem",
            opacity: selectedReview === "Good Teleop" ? 0.6 : 1,
          }}
          onClick={() => toggleReview("Good Teleop")}
          onMouseEnter={(e) => {
            if (selectedReview !== "Good Teleop")
              e.currentTarget.style.backgroundColor = "#5b50ed";
          }}
          onMouseLeave={(e) => {
            if (selectedReview !== "Good Teleop")
              e.currentTarget.style.backgroundColor = "#766dfc";
          }}
        >
          Good Teleop
        </button>
        <button
          style={{
            backgroundColor: "#ee68ad",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "500",
            padding: "0.75rem 1.2rem",
            cursor: "pointer",
            transition: "background 0.2s",
            width: "100%",
            height: "60px",
            fontSize: "1.1rem",
            opacity: selectedReview === "Bad Teleop" ? 0.6 : 1,
          }}
          onClick={() => toggleReview("Bad Teleop")}
          onMouseEnter={(e) => {
            if (selectedReview !== "Bad Teleop")
              e.currentTarget.style.backgroundColor = "#f14ba1";
          }}
          onMouseLeave={(e) => {
            if (selectedReview !== "Bad Teleop")
              e.currentTarget.style.backgroundColor = "#ee68ad";
          }}
        >
          Bad Teleop
        </button>
        <button
          style={{
            backgroundColor: "#dc7de3",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "500",
            padding: "0.75rem 1.2rem",
            cursor: "pointer",
            transition: "background 0.2s",
            width: "100%",
            height: "60px",
            fontSize: "1.1rem",
          }}
          onClick={handleSubmit}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#b85bbf")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#dc7de3")
          }
        >
          Submit
        </button>
        {submitMessage ? <p style={{ margin: 0 }}>{submitMessage}</p> : null}
        <button
          style={{
            backgroundColor: "#dc7de3",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "500",
            padding: "0.75rem 1.2rem",
            cursor: "pointer",
            transition: "background 0.2s",
            width: "100%",
            height: "60px",
          }}
          onClick={handleBackupSubmit}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#b85bbf")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#dc7de3")
          }
        >
          Backup Submit
        </button>
        {backupMessage ? <p style={{ margin: 0 }}>{backupMessage}</p> : null}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1rem",
            marginTop: "3rem",
            flexWrap: "wrap",
            width: "100%",
          }}
        >
          <button
            className="navBtns"
            style={{ flex: "1 1 auto", minWidth: "100px" }}
            onClick={() => navigate("/Endgame")}
          >
            Back
          </button>
          <button
            className="navBtns"
            style={{ flex: "1 1 auto", minWidth: "100px" }}
            onClick={() => navigate("/Prematch")}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
export default Submit;
