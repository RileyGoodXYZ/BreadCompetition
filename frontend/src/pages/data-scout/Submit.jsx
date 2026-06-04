import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { currentScoutCanUseAuto, isPracticeSession } from "../../utils/autoAccess";

function Submit() {
  const getDefaultReview = () =>
    currentScoutCanUseAuto() || isPracticeSession()
      ? "Good Auto"
      : "Good Teleop";

  const parseStoredReview = () => {
    const stored = localStorage.getItem("submit_review");
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      if (typeof parsed === "string") {
        return parsed.trim().length > 0 ? parsed : null;
      }
      if (Array.isArray(parsed)) {
        const firstReview = parsed.find(
          (value) =>
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
  const [submitMessage, setSubmitMessage] = useState("");
  const [backupMessage, setBackupMessage] = useState("");
  const [selectedReview, setSelectedReview] = useState(
    () => parseStoredReview() ?? getDefaultReview(),
  );

  useEffect(() => {
    if (
      window.location.hostname !== "localhost" &&
      localStorage.getItem("profile_is_signed_in") !== "true" &&
      !isPracticeSession()
    ) {
      navigate("/data-scout/profile");
    }
  }, [navigate]);
  const toggleReview = (value) => {
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
      "submit_client_uuid",
    ];

    keysToClear.forEach((key) => localStorage.removeItem(key));
  };

  const getOrCreateClientUuid = () => {
    const existing = localStorage.getItem("submit_client_uuid");
    if (existing) return existing;
    const fresh =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("submit_client_uuid", fresh);
    return fresh;
  };

  const buildPayload = () => {
    const rawButtonTimesV2 =
      localStorage.getItem("teleopv2_button_times") ?? "{}";
    const buttonTimesV2 = (() => {
      try {
        return JSON.parse(rawButtonTimesV2);
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
        (key) => Boolean(key) && autoButtonKeys.includes(key),
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
        : storedClimbType === "Side" ? "Side of Tower" : "";

    const teamNumber = localStorage.getItem("prematch_team_num") || null;
    const matchNumber = localStorage.getItem("prematch_match_num") || null;
    const eventKey = localStorage.getItem("profile_event_key") || null;
    const sessionType = localStorage.getItem("profile_session_type") || null;

    const data = {
      alliance: localStorage.getItem("prematch_alliance") ?? "red",
      position: localStorage.getItem("prematch_position") ?? "",
      prematch_no_show: localStorage.getItem("prematch_no_show") === "true",
      review: selectedReview,
      auto_climb_selection: localStorage.getItem("auto_climb_selection") ?? "",
      auto_pass_count: Number(localStorage.getItem("auto_pass_count") ?? "0"),
      auto_score_count: Number(localStorage.getItem("auto_score_count") ?? "0"),
      auto_pass_seconds: Number(localStorage.getItem("auto_pass_seconds") ?? "0"),
      auto_score_seconds: Number(localStorage.getItem("auto_score_seconds") ?? "0"),
      auto_button_times: autoButtonTimesText,
      climb: localStorage.getItem("endgame_climb") ?? "None",
      endgame_result: endgameResult,
      endgame_level: endgameLevel,
      endgame_tower_position: endgameTowerPosition,
      shoot_while_climb: localStorage.getItem("endgame_shoot_while_climb") === "true",
      buddy_climb: localStorage.getItem("endgame_buddy_climb") === "true",
      score: v2Score,
      pass: v2Pass,
      defense: v2Defense,
      herd: v2Herd,
    };

    return {
      scout_name: localStorage.getItem("profile_scout_name") ?? "Maxwell Li",
      team_number: teamNumber ?? 0,
      event_key: eventKey,
      match_number: matchNumber,
      session_type: sessionType,
      client_uuid: getOrCreateClientUuid(),
      data,
    };
  };

  const copyTextToClipboard = async (text) => {
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
    const payload = buildPayload();

    if (!payload.scout_name) {
      setSubmitMessage("Submit failed: missing scout name (visit Profile).");
      return;
    }
    if (payload.team_number <= 0) {
      setSubmitMessage("Submit failed: missing or invalid team number.");
      return;
    }

    setSubmitMessage("Submitting...");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/scouting/match`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        setSubmitMessage(`Submit failed: ${errorText}`);
        return;
      }

      resetScoutingData();
      const nextDefault = getDefaultReview();
      setSelectedReview(nextDefault);
      localStorage.setItem("submit_review", JSON.stringify(nextDefault));
      setSubmitMessage("Submitted! Next match...");
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
            onClick={() => navigate("/data-scout/endgame")}
          >
            Back
          </button>
          <button
            className="navBtns"
            style={{ flex: "1 1 auto", minWidth: "100px" }}
            onClick={() => navigate("/data-scout/prematch")}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
export default Submit;
