import { useState, useEffect } from 'react';
import { Checkbox, DropdownMenu } from "radix-ui";
import { CheckIcon } from "@radix-ui/react-icons";
import { useNavigate } from 'react-router-dom';
import { currentScoutCanUseAuto, isPracticeSession, isTeleopV2Session } from '../../utils/autoAccess';
import * as React from "react"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

function Endgame() {
  const savedClimb = localStorage.getItem('endgame_climb') ?? 'None';
  const savedClimbType = localStorage.getItem('endgame_climb_type') ?? 'Center';
  const initialClimbStatus = savedClimb === 'None' ? 'None' : (savedClimb === 'Failed' ? 'Failed' : 'Success');
  const initialClimbLevel =
    savedClimb === 'Level 1' || savedClimb === 'Level 2' || savedClimb === 'Level 3' ? savedClimb : null;
  const [climbStatus, setClimbStatus] = useState(initialClimbStatus);
  const [climbLevel, setClimbLevel] = useState(initialClimbLevel);
  const [climbType, setClimbType] = useState(savedClimbType === 'Side' ? 'Side' : 'Center');
  const [shootWhileClimb, setShootWhileClimb] = useState(localStorage.getItem('endgame_shoot_while_climb') === 'true');
  const [buddyClimb, setBuddyClimb] = useState(localStorage.getItem('endgame_buddy_climb') === 'true');
  const navigate = useNavigate();
  
  useEffect(() => {
    if (
      window.location.hostname !== 'localhost' &&
      localStorage.getItem('profile_is_signed_in') !== 'true' &&
      !isPracticeSession()
    ) {
      navigate('/data-scout/profile');
    }
  }, [navigate]);

  const persistClimb = (nextStatus, nextLevel, nextType) => {
    let finalValue = 'None';
    if (nextStatus === 'Success') {
      finalValue = nextLevel ?? 'None';
    } else if (nextStatus === 'Failed') {
      finalValue = 'Failed';
    }
    const shouldStoreType = nextStatus === 'Success';
    localStorage.setItem('endgame_climb', finalValue);
    localStorage.setItem('endgame_climb_status', nextStatus);
    localStorage.setItem('endgame_climb_level', shouldStoreType ? (nextLevel ?? '') : '');
    localStorage.setItem('endgame_climb_type', shouldStoreType ? nextType : '');
  };

  const handleStatusSelect = (status) => {
    setClimbStatus(status);
    persistClimb(status, status === 'Success' ? climbLevel : null, climbType);
  };

  const handleLevelSelect = (level) => {
    setClimbLevel(level);
    setClimbStatus("Success");
    persistClimb('Success', level, climbType);
  };

  const handleClimbTypeSelect = (type) => {
    setClimbType(type);
    persistClimb(climbStatus, climbLevel, type);
  };


  return (
    <div className="mainContainer" style={{padding: '40px 60px', margin: '0 auto'}}>
      {/* Top header */}
      <div style={{marginBottom: '20px'}}>
        <div>
          <h1>Endgame</h1>
        </div>
      </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
      <FieldGroup className="w-full max-w-xs">
          <Field>
          <Select value={climbLevel || ""} onValueChange={setClimbLevel}>
            <SelectTrigger>
              <SelectValue placeholder="Select Climb Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="Level 1" onClick={() => handleLevelSelect("Level 1")}>Level 1</SelectItem>
                <SelectItem value="Level 2" onClick={() => handleLevelSelect("Level 2")}>Level 2</SelectItem>
                <SelectItem value="Level 3" onClick={() => handleLevelSelect("Level 3")}>Level 3</SelectItem>
                <SelectItem value="Not Attempted">Not Attempted</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          </Field>
        </FieldGroup>
      </div>


      {/* Climb type selection (only on success) */}
      <div style={{ marginTop: '0.5rem',marginBottom: '1rem', display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '1rem', width: '100%',visibility: climbLevel && climbLevel != "Not Attempted" ? 'visible' : 'hidden', height: climbLevel && climbLevel != "Not Attempted" ? 'auto' : '0'  }}>
        <button style={{ background: climbType === 'Center' ? '#f6e7b2' : '#e0e0e0', color: '#2f1404', opacity: climbType === 'Center' ? 0.7 : 1 }} onClick={() => handleClimbTypeSelect('Center')}>Center of Tower</button>
        <button style={{ background: climbType === 'Side' ? '#f6e7b2' : '#e0e0e0', color: '#2f1404', opacity: climbType === 'Side' ? 0.7 : 1 }} onClick={() => handleClimbTypeSelect('Side')}>Side of Tower</button>
      </div>

      {/* Checkbox - only on success*/}
      <div style={{ display: 'flex', flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: "1rem", flexWrap: 'wrap', gap: '1rem',visibility:  climbLevel && climbLevel != "Not Attempted" ? 'visible' : 'hidden', height: climbLevel && climbLevel != "Not Attempted" ? 'auto' : '0'  }}>
        <div style={{ display: "flex", alignItems: "center", gap: '0.5rem', marginRight: '4.4rem' }}>
          <Checkbox.Root className="CheckboxRoot" id="c1" onClick={() => {
            const next = !shootWhileClimb;
            setShootWhileClimb(next);
            localStorage.setItem('endgame_shoot_while_climb', String(next));
          }} checked={shootWhileClimb}>
            <Checkbox.Indicator className="CheckboxIndicator">
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>
        <label className="Label">
            Shooting while climbing?
          </label>
        </div>
        <center>
        <div style={{ display: "flex", alignItems: "center", gap: '0.5rem', marginRight: '0.1rem' }}>
          <Checkbox.Root className="CheckboxRoot" id="c2" onClick={() => {
            const next = !buddyClimb;
            setBuddyClimb(next);
            localStorage.setItem('endgame_buddy_climb', String(next));
          }} checked={buddyClimb}>
            <Checkbox.Indicator className="CheckboxIndicator">
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <label className="Label">
          Did they climb with another robot?
          </label>
        </div>
        </center>
      </div>

      {climbLevel && climbLevel != "Not Attempted" &&(
        <div style={{ marginTop: '1rem', marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
          <button style={{ background: climbStatus === "Failed" ? '#d7b3fb' : '#e0e0e0', color: '#2f1404', opacity: climbStatus === "Failed" ? 0.7 : 1}} onClick={() => handleStatusSelect(climbStatus === 'Failed' ? 'Success' : 'Failed')}>Failed</button>
        </div>
      )}

      {/* Navigation buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: "1rem", flexWrap: 'wrap', width: '100%' }}>
        <button
          className="navBtns"
          style={{ flex: '1 1 auto', minWidth: '100px' }}
          onClick={() =>
            navigate(currentScoutCanUseAuto() && !isTeleopV2Session() ? '/data-scout/auto' : '/data-scout/teleop')
          }
        >
          Back
        </button>
        <button className = "navBtns" style={{ flex: '1 1 auto', minWidth: '100px'}} onClick={() => navigate('/data-scout/submit')}>Next</button>
      </div>
    </div>
  );
}

export default Endgame;
