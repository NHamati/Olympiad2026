
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Trophy,
  RotateCcw,
  Download,
  Users,
  Timer,
  Target,
  ShieldAlert,
  Award,
  Medal,
  Crown,
  MonitorPlay,
  Play,
  Pause,
  Expand,
} from "lucide-react";

const EVENTS = ["Kong Pong", "Cornhole", "Dodgeball", "Pop-A-Shot", "Relay Race"];
const GROUPS = ["A", "B", "C", "D", "E"];

const TEAM_COUNT = 100;
const GROUP_SIZE = 20;
const ROUNDS = 5;

const STORAGE_KEY = "olympiad-2026-tournament-scoring-v2";
const RESET_PASSWORD_HASH = btoa("Olympiad2026");

const COLORS = {
  green: "#93B37E",
  darkGreen: "#3C5644",
  ivory: "#FCFCF5",
  white: "#FFFFFF",
  charcoal: "#30302F",
  moss: "#919347",
  border: "#DDE5D7",
  softGreen: "#EDF4E8",
  goldBg: "#FFF6D6",
  goldBorder: "#E7C95B",
  silverBg: "#F3F4F6",
  silverBorder: "#C9CED6",
  bronzeBg: "#F6E3D3",
  bronzeBorder: "#C98B5B",
};

const defaultTeams = Array.from({ length: TEAM_COUNT }, (_, i) => ({
  id: i + 1,
  name: `Team ${i + 1}`,
}));

const eventRotationByRound = {
  0: { A: "Kong Pong", B: "Cornhole", C: "Dodgeball", D: "Pop-A-Shot", E: "Relay Race" },
  1: { A: "Cornhole", B: "Dodgeball", C: "Pop-A-Shot", D: "Relay Race", E: "Kong Pong" },
  2: { A: "Dodgeball", B: "Pop-A-Shot", C: "Relay Race", D: "Kong Pong", E: "Cornhole" },
  3: { A: "Pop-A-Shot", B: "Relay Race", C: "Kong Pong", D: "Cornhole", E: "Dodgeball" },
  4: { A: "Relay Race", B: "Kong Pong", C: "Cornhole", D: "Dodgeball", E: "Pop-A-Shot" },
};

function makeDefaultTeamNames() {
  return defaultTeams.map((t) => t.name).join("\n");
}

function chunkIntoGroups(teams) {
  const groups = { A: [], B: [], C: [], D: [], E: [] };

  teams.forEach((team, index) => {
    const groupIndex = Math.floor(index / GROUP_SIZE);
    const groupKey = GROUPS[groupIndex] || "E";
    groups[groupKey].push(team);
  });

  return groups;
}

function circlePairings(teams, roundIndex) {
  if (!teams.length) return [];
  const shifted = teams.map((_, i) => teams[(i + (roundIndex % teams.length)) % teams.length]);
  const firstHalf = shifted.slice(0, GROUP_SIZE / 2);
  const secondHalf = shifted.slice(GROUP_SIZE / 2).reverse();
  return firstHalf.map((team, i) => [team, secondHalf[i]]);
}

function buildSchedule(teams) {
  const groups = chunkIntoGroups(teams);
  const rounds = [];

  for (let round = 0; round < ROUNDS; round++) {
    const roundData = [];

    GROUPS.forEach((groupKey) => {
      const eventName = eventRotationByRound[round][groupKey];
      const pairings = circlePairings(groups[groupKey], round);

      pairings.forEach((pair, idx) => {
        roundData.push({
          round: round + 1,
          group: groupKey,
          event: eventName,
          station: idx + 1,
          team1: pair[0],
          team2: pair[1],
        });
      });
    });

    rounds.push(roundData);
  }

  return rounds;
}

function calculateDifferential(a, b) {
  return a - b;
}

function formatRelayTime(ms) {
  if (!ms || ms <= 0) return "";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
}

function exportJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function parseNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function isResetPasswordValid(passwordInput) {
  return btoa(passwordInput) === RESET_PASSWORD_HASH;
}

function getPodiumStyle(rank) {
  if (rank === 1) {
    return {
      background: COLORS.goldBg,
      borderColor: COLORS.goldBorder,
      accent: COLORS.goldBorder,
      label: "1st Place",
      icon: Crown,
    };
  }

  if (rank === 2) {
    return {
      background: COLORS.silverBg,
      borderColor: COLORS.silverBorder,
      accent: COLORS.silverBorder,
      label: "2nd Place",
      icon: Medal,
    };
  }

  return {
    background: COLORS.bronzeBg,
    borderColor: COLORS.bronzeBorder,
    accent: COLORS.bronzeBorder,
    label: "3rd Place",
    icon: Medal,
  };
}

function getRowHighlight(rank) {
  if (rank === 1) return { background: COLORS.goldBg };
  if (rank === 2) return { background: COLORS.silverBg };
  if (rank === 3) return { background: COLORS.bronzeBg };
  return {};
}

function iconWithText(Icon, text) {
  return (
    <>
      <Icon size={18} />
      <span>{text}</span>
    </>
  );
}

export default function TournamentTrackerApp() {
  const [teams, setTeams] = useState(defaultTeams);
  const [showResetPrompt, setShowResetPrompt] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState("");
  const [resetError, setResetError] = useState("");
  const [newTeamNames, setNewTeamNames] = useState(makeDefaultTeamNames());
  const [matchResults, setMatchResults] = useState({});
  const [roundMinutes, setRoundMinutes] = useState(15);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const spectatorScrollRef = useRef(null);
  const spectatorWrapperRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed.teams) && parsed.teams.length === TEAM_COUNT) {
        setTeams(parsed.teams);
      }
      if (typeof parsed.newTeamNames === "string") {
        setNewTeamNames(parsed.newTeamNames);
      }
      if (parsed.matchResults && typeof parsed.matchResults === "object") {
        setMatchResults(parsed.matchResults);
      }
      if (typeof parsed.roundMinutes === "number" && parsed.roundMinutes > 0) {
        setRoundMinutes(parsed.roundMinutes);
      }
    } catch (error) {
      console.error("Failed to load saved tournament data", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          teams,
          newTeamNames,
          matchResults,
          roundMinutes,
        })
      );
    } catch (error) {
      console.error("Failed to save tournament data", error);
    }
  }, [teams, newTeamNames, matchResults, roundMinutes]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const schedule = useMemo(() => buildSchedule(teams), [teams]);

  const eventSummary = useMemo(() => {
    return EVENTS.map((event) => {
      const matches = schedule.flat().filter((match) => match.event === event);
      const completed = matches.filter(
        (match) => matchResults[`${match.round}-${match.group}-${match.event}-${match.station}`]
      );

      return {
        event,
        matches: matches.length,
        completed: completed.length,
        perRound: 10,
        teamsPerRound: 20,
      };
    });
  }, [schedule, matchResults]);

  const totalMatches = schedule.flat().length;
  const completedMatches = schedule
    .flat()
    .filter((match) => matchResults[`${match.round}-${match.group}-${match.event}-${match.station}`]).length;
  const estimatedMinutes = Math.max(1, roundMinutes) * ROUNDS;

  const standings = useMemo(() => {
    const base = teams.map((t) => ({
      ...t,
      wins: 0,
      losses: 0,
      differential: 0,
      points: 0,
      relayTimeMs: null,
      relayDisplay: "",
      scoreFor: 0,
      scoreAgainst: 0,
    }));

    const byId = Object.fromEntries(base.map((t) => [t.id, t]));

    schedule.flat().forEach((match) => {
      const key = `${match.round}-${match.group}-${match.event}-${match.station}`;
      const result = matchResults[key];
      if (!result) return;

      const t1 = byId[match.team1.id];
      const t2 = byId[match.team2.id];

      if (!t1 || !t2) return;

      if (match.event === "Relay Race") {
        const time1 = parseNumber(result.team1TimeMs);
        const time2 = parseNumber(result.team2TimeMs);

        if (time1 > 0) {
          t1.relayTimeMs = (t1.relayTimeMs || 0) + time1;
          t1.relayDisplay = formatRelayTime(t1.relayTimeMs);
        }

        if (time2 > 0) {
          t2.relayTimeMs = (t2.relayTimeMs || 0) + time2;
          t2.relayDisplay = formatRelayTime(t2.relayTimeMs);
        }

        if (time1 > 0 && time2 > 0) {
          if (time1 < time2) {
            t1.wins++;
            t2.losses++;
          } else if (time2 < time1) {
            t2.wins++;
            t1.losses++;
          }
        }

        return;
      }

      const score1 = parseNumber(result.team1Score);
      const score2 = parseNumber(result.team2Score);

      t1.points += score1;
      t2.points += score2;

      t1.scoreFor += score1;
      t1.scoreAgainst += score2;

      t2.scoreFor += score2;
      t2.scoreAgainst += score1;

      t1.differential += calculateDifferential(score1, score2);
      t2.differential += calculateDifferential(score2, score1);

      if (score1 > score2) {
        t1.wins++;
        t2.losses++;
      } else if (score2 > score1) {
        t2.wins++;
        t1.losses++;
      }
    });

    return Object.values(byId).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.differential !== a.differential) return b.differential - a.differential;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return (a.relayTimeMs || Infinity) - (b.relayTimeMs || Infinity);
    });
  }, [teams, schedule, matchResults]);

  useEffect(() => {
    if (!autoScrollEnabled) return;

    const container = spectatorScrollRef.current;
    if (!container) return;

    let timerId;

    const step = () => {
      const maxScroll = container.scrollHeight - container.clientHeight;

      if (maxScroll > 0) {
        const next = container.scrollTop + 1.2;

        if (next >= maxScroll - 2) {
          container.scrollTo({ top: 0, behavior: "auto" });
        } else {
          container.scrollTo({ top: next, behavior: "auto" });
        }
      }

      timerId = window.setTimeout(step, 25);
    };

    step();

    return () => {
      window.clearTimeout(timerId);
    };
  }, [autoScrollEnabled, standings.length]);

  const topThree = standings.slice(0, 3);

  const handleApplyTeams = () => {
    const names = newTeamNames
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean)
      .slice(0, TEAM_COUNT);

    const padded = Array.from({ length: TEAM_COUNT }, (_, i) => ({
      id: i + 1,
      name: names[i] || `Team ${i + 1}`,
    }));

    setTeams(padded);
    setMatchResults({});
    setResetError("");
    setShowResetPrompt(false);
    setResetPasswordInput("");
  };

  const updateResult = (match, field, value) => {
    const key = `${match.round}-${match.group}-${match.event}-${match.station}`;

    setMatchResults((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: value,
      },
    }));
  };

  const confirmReset = () => {
    if (!isResetPasswordValid(resetPasswordInput)) {
      setResetError("Incorrect password");
      return;
    }

    setTeams(defaultTeams);
    setNewTeamNames(makeDefaultTeamNames());
    setMatchResults({});
    setRoundMinutes(15);

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear saved tournament data", error);
    }

    setShowResetPrompt(false);
    setResetPasswordInput("");
    setResetError("");
  };

  const exportData = () => {
    exportJson("tournament-data.json", {
      teams,
      schedule,
      matchResults,
      standings,
      exportedAt: new Date().toISOString(),
    });
  };

  const enterFullScreen = async () => {
    const el = spectatorWrapperRef.current;
    if (!el) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      if (el.requestFullscreen) {
        await el.requestFullscreen();
        return;
      }

      if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
        return;
      }

      if (el.msRequestFullscreen) {
        el.msRequestFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen request failed", error);
    }
  };

  const outerWrap = {
    minHeight: "100vh",
    padding: "16px",
    color: COLORS.charcoal,
    background: `linear-gradient(180deg, ${COLORS.ivory} 0%, ${COLORS.white} 100%)`,
  };

  const pageWrap = {
    maxWidth: "1280px",
    margin: "0 auto",
    display: "grid",
    gap: "24px",
  };

  return (
    <div style={outerWrap}>
      <div style={pageWrap}>
        <div
          style={{
            borderRadius: "24px",
            border: `1px solid ${COLORS.border}`,
            background: COLORS.white,
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ display: "flex", gap: "16px", justifyContent: "space-between", flexWrap: "wrap" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "40px", color: COLORS.darkGreen }}>Olympiad 2026 Tournament Scoring</h1>
              <p style={{ margin: "8px 0 0", color: COLORS.charcoal }}>
                Saguaros scoring dashboard for 100 teams, 5 events, 5 rounds, live score entry, standings, and spectator mode.
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <Button
                variant="outline"
                onClick={exportData}
                style={{ borderColor: COLORS.green, color: COLORS.darkGreen, background: COLORS.white }}
              >
                {iconWithText(Download, "Export Data")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowResetPrompt(true);
                  setResetPasswordInput("");
                  setResetError("");
                }}
                style={{ borderColor: COLORS.moss, color: COLORS.charcoal, background: COLORS.white }}
              >
                {iconWithText(RotateCcw, "Confirm Reset")}
              </Button>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          {[
            { icon: Users, value: teams.length, label: "Teams", color: COLORS.green },
            { icon: Target, value: totalMatches, label: "Total Matchups", color: COLORS.darkGreen },
            { icon: Trophy, value: completedMatches, label: "Completed", color: COLORS.moss },
            { icon: Timer, value: `${estimatedMinutes} min`, label: "Estimated Play Time", color: COLORS.darkGreen },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.label}
                style={{
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "20px",
                  background: COLORS.white,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
              >
                <CardContent style={{ display: "flex", gap: "12px", alignItems: "center", padding: "24px" }}>
                  <Icon size={32} color={item.color} />
                  <div>
                    <div style={{ fontSize: "28px", fontWeight: 800 }}>{item.value}</div>
                    <div style={{ fontSize: "14px", color: COLORS.charcoal }}>{item.label}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="standings" className="space-y-4">
          <TabsList
            style={{
              border: `1px solid ${COLORS.border}`,
              background: COLORS.softGreen,
              borderRadius: "16px",
              padding: "4px",
              gap: "4px",
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            }}
          >
            <TabsTrigger value="overview" style={{ color: COLORS.darkGreen }}>Overview</TabsTrigger>
            <TabsTrigger value="teams" style={{ color: COLORS.darkGreen }}>Teams</TabsTrigger>
            <TabsTrigger value="schedule" style={{ color: COLORS.darkGreen }}>Schedule</TabsTrigger>
            <TabsTrigger value="standings" style={{ color: COLORS.darkGreen }}>Standings</TabsTrigger>
            <TabsTrigger value="spectator" style={{ color: COLORS.darkGreen }}>Spectator</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
              <Card style={{ border: `1px solid ${COLORS.border}`, borderRadius: "20px", background: COLORS.white }}>
                <CardHeader style={{ padding: "20px 20px 0" }}>
                  <CardTitle style={{ color: COLORS.darkGreen, fontWeight: 800, fontSize: "22px" }}>Event Plan</CardTitle>
                </CardHeader>
                <CardContent style={{ padding: "20px", display: "grid", gap: "12px" }}>
                  {eventSummary.map((item) => (
                    <div
                      key={item.event}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                        border: `1px solid ${COLORS.border}`,
                        background: COLORS.softGreen,
                        borderRadius: "16px",
                        padding: "12px",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700 }}>{item.event}</div>
                        <div style={{ fontSize: "14px", color: COLORS.charcoal }}>
                          {item.teamsPerRound} teams per round • {item.perRound} matchups per round
                        </div>
                      </div>
                      <Badge style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, color: COLORS.darkGreen }}>
                        {item.completed}/{item.matches}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card style={{ border: `1px solid ${COLORS.border}`, borderRadius: "20px", background: COLORS.white }}>
                <CardHeader style={{ padding: "20px 20px 0" }}>
                  <CardTitle style={{ color: COLORS.darkGreen, fontWeight: 800, fontSize: "22px" }}>Round Settings</CardTitle>
                </CardHeader>
                <CardContent style={{ padding: "20px", display: "grid", gap: "16px" }}>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <Label htmlFor="roundMinutes">Minutes per round</Label>
                    <Input
                      id="roundMinutes"
                      type="number"
                      inputMode="numeric"
                      min="1"
                      value={roundMinutes}
                      onChange={(e) => setRoundMinutes(Math.max(1, parseNumber(e.target.value) || 15))}
                      style={{ borderColor: COLORS.border, background: COLORS.white }}
                    />
                  </div>
                  <div
                    style={{
                      border: `1px solid ${COLORS.border}`,
                      background: COLORS.softGreen,
                      borderRadius: "16px",
                      padding: "16px",
                      fontSize: "14px",
                      color: COLORS.charcoal,
                    }}
                  >
                    Recommended starting point: 12 minutes of play plus 3 minutes to rotate, for a 15-minute round. Scores are tracked as points for Kong Pong, Cornhole, Dodgeball, and Pop-A-Shot, with scoring differential used in the standings. Relay Race is tracked by time, with faster times breaking ties after points, differential, and wins.
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <Card style={{ border: `1px solid ${COLORS.border}`, borderRadius: "20px", background: COLORS.white }}>
              <CardHeader style={{ padding: "20px 20px 0" }}>
                <CardTitle style={{ color: COLORS.darkGreen, fontWeight: 800, fontSize: "22px" }}>Team Setup</CardTitle>
              </CardHeader>
              <CardContent style={{ padding: "20px", display: "grid", gap: "16px" }}>
                <p style={{ margin: 0, fontSize: "14px", color: COLORS.charcoal }}>
                  Paste up to 100 team names, one per line. The app auto-builds five 20-team groups and rotates each group through all five events.
                </p>
                <textarea
                  style={{
                    minHeight: "320px",
                    width: "100%",
                    borderRadius: "16px",
                    border: `1px solid ${COLORS.border}`,
                    padding: "12px",
                    background: COLORS.white,
                    color: COLORS.charcoal,
                  }}
                  value={newTeamNames}
                  onChange={(e) => setNewTeamNames(e.target.value)}
                />
                <div>
                  <Button onClick={handleApplyTeams} style={{ background: COLORS.green, color: COLORS.white }}>
                    Apply Team List
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            {schedule.map((roundMatches, roundIndex) => (
              <Card key={roundIndex} style={{ border: `1px solid ${COLORS.border}`, borderRadius: "20px", background: COLORS.white }}>
                <CardHeader style={{ padding: "20px 20px 0" }}>
                  <CardTitle style={{ color: COLORS.darkGreen, fontWeight: 800, fontSize: "22px" }}>Round {roundIndex + 1}</CardTitle>
                </CardHeader>
                <CardContent style={{ padding: "20px" }}>
                  <ScrollArea>
                    <div style={{ minWidth: "1100px" }}>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Group</TableHead>
                            <TableHead>Event</TableHead>
                            <TableHead>Station</TableHead>
                            <TableHead>Team 1</TableHead>
                            <TableHead>Score / Time</TableHead>
                            <TableHead>Team 2</TableHead>
                            <TableHead>Score / Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {roundMatches.map((match) => {
                            const key = `${match.round}-${match.group}-${match.event}-${match.station}`;
                            const result = matchResults[key] || {};
                            const isRelay = match.event === "Relay Race";

                            return (
                              <TableRow key={key}>
                                <TableCell>{match.group}</TableCell>
                                <TableCell>{match.event}</TableCell>
                                <TableCell>{match.station}</TableCell>
                                <TableCell>{match.team1.name}</TableCell>
                                <TableCell>
                                  <div style={{ width: isRelay ? "112px" : "80px" }}>
                                    <Input
                                      type="number"
                                      inputMode="numeric"
                                      min="0"
                                      value={isRelay ? result.team1TimeMs || "" : result.team1Score || ""}
                                      onChange={(e) =>
                                        updateResult(
                                          match,
                                          isRelay ? "team1TimeMs" : "team1Score",
                                          e.target.value
                                        )
                                      }
                                      placeholder={isRelay ? "ms" : "0"}
                                      style={{ borderColor: COLORS.border, background: COLORS.white }}
                                    />
                                  </div>
                                </TableCell>
                                <TableCell>{match.team2.name}</TableCell>
                                <TableCell>
                                  <div style={{ width: isRelay ? "112px" : "80px" }}>
                                    <Input
                                      type="number"
                                      inputMode="numeric"
                                      min="0"
                                      value={isRelay ? result.team2TimeMs || "" : result.team2Score || ""}
                                      onChange={(e) =>
                                        updateResult(
                                          match,
                                          isRelay ? "team2TimeMs" : "team2Score",
                                          e.target.value
                                        )
                                      }
                                      placeholder={isRelay ? "ms" : "0"}
                                      style={{ borderColor: COLORS.border, background: COLORS.white }}
                                    />
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="standings" className="space-y-5">
            <Card style={{ border: `2px solid ${COLORS.green}`, borderRadius: "24px", background: COLORS.white, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
              <CardHeader style={{ padding: "20px" }}>
                <CardTitle style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "32px", color: COLORS.darkGreen, fontWeight: 800 }}>
                  <Trophy size={28} color={COLORS.green} />
                  Live Leaderboard
                </CardTitle>
                <p style={{ margin: "8px 0 0", color: COLORS.charcoal }}>
                  Top teams are ranked by total points, then differential, then wins, then relay time.
                </p>
              </CardHeader>
            </Card>

            {topThree.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
                {[1, 0, 2].filter((index) => topThree[index]).map((index) => {
                  const team = topThree[index];
                  const rank = index + 1;
                  const style = getPodiumStyle(rank);
                  const Icon = style.icon;

                  return (
                    <Card
                      key={team.id}
                      style={{
                        border: `2px solid ${style.borderColor}`,
                        borderRadius: "24px",
                        background: style.background,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                    >
                      <CardContent style={{ padding: "24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                          <Badge style={{ background: COLORS.white, border: `1px solid ${style.borderColor}`, color: COLORS.darkGreen }}>
                            {style.label}
                          </Badge>
                          <Icon size={28} color={style.accent} />
                        </div>

                        <div style={{ fontSize: "32px", fontWeight: 900, color: COLORS.darkGreen }}>{team.name}</div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "16px" }}>
                          {[
                            ["Points", team.points],
                            ["Diff", team.differential],
                            ["Wins", team.wins],
                            ["Relay", team.relayDisplay || "-"],
                          ].map(([label, value]) => (
                            <div key={label} style={{ borderRadius: "16px", border: `1px solid ${style.borderColor}`, background: COLORS.white, padding: "12px" }}>
                              <div style={{ fontSize: "12px", textTransform: "uppercase", color: COLORS.charcoal, letterSpacing: "0.06em" }}>{label}</div>
                              <div style={{ marginTop: "4px", fontSize: "24px", fontWeight: 800, color: COLORS.darkGreen }}>{value}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <Card style={{ border: `1px solid ${COLORS.border}`, borderRadius: "24px", background: COLORS.white }}>
              <CardHeader style={{ padding: "20px 20px 0" }}>
                <CardTitle style={{ display: "flex", alignItems: "center", gap: "8px", color: COLORS.darkGreen, fontSize: "24px", fontWeight: 800 }}>
                  <Award size={24} color={COLORS.green} />
                  Full Standings
                </CardTitle>
              </CardHeader>
              <CardContent style={{ padding: "20px" }}>
                <ScrollArea>
                  <div style={{ minWidth: "900px" }}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rank</TableHead>
                          <TableHead>Team</TableHead>
                          <TableHead>Points</TableHead>
                          <TableHead>Diff</TableHead>
                          <TableHead>Wins</TableHead>
                          <TableHead>Losses</TableHead>
                          <TableHead>Relay</TableHead>
                          <TableHead>PF</TableHead>
                          <TableHead>PA</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {standings.map((team, idx) => {
                          const rank = idx + 1;
                          return (
                            <TableRow key={team.id} style={getRowHighlight(rank)}>
                              <TableCell style={{ fontWeight: 700 }}>
                                {rank === 1 ? "🥇 1" : rank === 2 ? "🥈 2" : rank === 3 ? "🥉 3" : rank}
                              </TableCell>
                              <TableCell style={{ fontWeight: rank <= 3 ? 800 : 500 }}>{team.name}</TableCell>
                              <TableCell>{team.points}</TableCell>
                              <TableCell>{team.differential}</TableCell>
                              <TableCell>{team.wins}</TableCell>
                              <TableCell>{team.losses}</TableCell>
                              <TableCell>{team.relayDisplay || "-"}</TableCell>
                              <TableCell>{team.scoreFor}</TableCell>
                              <TableCell>{team.scoreAgainst}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="spectator" className="space-y-6">
            <div ref={spectatorWrapperRef} style={{ display: "grid", gap: "24px" }}>
              <div
                style={{
                  borderRadius: "32px",
                  border: `2px solid ${COLORS.green}`,
                  background: COLORS.white,
                  padding: "28px",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
                  minHeight: isFullscreen ? "100vh" : "auto",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", alignItems: "end" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <MonitorPlay size={40} color={COLORS.green} />
                      <h2 style={{ margin: 0, fontSize: "64px", lineHeight: 1, fontWeight: 900, color: COLORS.darkGreen }}>
                        LEADERBOARD
                      </h2>
                    </div>
                    <p style={{ margin: "12px 0 0", fontSize: "28px", fontWeight: 600, color: COLORS.charcoal }}>
                      Live tournament standings
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <Button
                      variant="outline"
                      onClick={() => setAutoScrollEnabled((prev) => !prev)}
                      style={{ borderColor: COLORS.green, color: COLORS.darkGreen, background: COLORS.white, minHeight: "56px", fontSize: "18px" }}
                    >
                      {autoScrollEnabled ? iconWithText(Pause, "Pause Auto-Scroll") : iconWithText(Play, "Start Auto-Scroll")}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={enterFullScreen}
                      style={{ borderColor: COLORS.green, color: COLORS.darkGreen, background: COLORS.white, minHeight: "56px", fontSize: "18px" }}
                    >
                      {iconWithText(Expand, isFullscreen ? "Exit Full Screen" : "Full Screen")}
                    </Button>
                  </div>
                </div>

                {topThree.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginTop: "24px" }}>
                    {[1, 0, 2].filter((index) => topThree[index]).map((index) => {
                      const team = topThree[index];
                      const rank = index + 1;
                      const style = getPodiumStyle(rank);
                      const Icon = style.icon;

                      return (
                        <div
                          key={`spectator-podium-${team.id}`}
                          style={{
                            borderRadius: "28px",
                            border: `2px solid ${style.borderColor}`,
                            background: style.background,
                            boxShadow: "0 6px 14px rgba(0,0,0,0.08)",
                          }}
                        >
                          <div style={{ padding: "28px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                              <div
                                style={{
                                  borderRadius: "999px",
                                  border: `1px solid ${style.borderColor}`,
                                  background: COLORS.white,
                                  padding: "8px 16px",
                                  fontSize: "18px",
                                  fontWeight: 800,
                                  color: COLORS.darkGreen,
                                }}
                              >
                                {style.label}
                              </div>
                              <Icon size={36} color={style.accent} />
                            </div>

                            <div style={{ fontSize: "42px", lineHeight: 1.1, fontWeight: 900, color: COLORS.darkGreen }}>
                              {team.name}
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "24px" }}>
                              <div style={{ borderRadius: "18px", border: `1px solid ${style.borderColor}`, background: COLORS.white, padding: "16px" }}>
                                <div style={{ fontSize: "12px", textTransform: "uppercase", color: COLORS.charcoal, letterSpacing: "0.08em", fontWeight: 700 }}>Points</div>
                                <div style={{ marginTop: "6px", fontSize: "44px", fontWeight: 900, color: COLORS.darkGreen }}>{team.points}</div>
                              </div>
                              <div style={{ borderRadius: "18px", border: `1px solid ${style.borderColor}`, background: COLORS.white, padding: "16px" }}>
                                <div style={{ fontSize: "12px", textTransform: "uppercase", color: COLORS.charcoal, letterSpacing: "0.08em", fontWeight: 700 }}>Diff</div>
                                <div style={{ marginTop: "6px", fontSize: "44px", fontWeight: 900, color: COLORS.darkGreen }}>{team.differential}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div
                  style={{
                    marginTop: "24px",
                    overflow: "hidden",
                    borderRadius: "32px",
                    border: `2px solid ${COLORS.green}`,
                    background: COLORS.white,
                    boxShadow: "0 8px 18px rgba(0,0,0,0.08)",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "120px 1fr 160px 160px 140px",
                      alignItems: "center",
                      borderBottom: `1px solid ${COLORS.border}`,
                      background: COLORS.softGreen,
                      color: COLORS.darkGreen,
                      padding: "20px 32px",
                      fontSize: "28px",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    <div>Rank</div>
                    <div>Team</div>
                    <div>Points</div>
                    <div>Diff</div>
                    <div>Wins</div>
                  </div>

                  <div
                    ref={spectatorScrollRef}
                    style={{
                      maxHeight: "72vh",
                      overflowY: "auto",
                      scrollBehavior: "auto",
                    }}
                  >
                    {standings.map((team, idx) => {
                      const rank = idx + 1;
                      const highlight = getRowHighlight(rank);

                      return (
                        <div
                          key={`spectator-big-${team.id}`}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "120px 1fr 160px 160px 140px",
                            alignItems: "center",
                            borderBottom: `1px solid ${COLORS.border}`,
                            padding: "24px 32px",
                            ...highlight,
                          }}
                        >
                          <div style={{ fontSize: "38px", fontWeight: 900, color: COLORS.darkGreen }}>
                            {rank === 1 ? "🥇 1" : rank === 2 ? "🥈 2" : rank === 3 ? "🥉 3" : rank}
                          </div>

                          <div style={{ paddingRight: "24px" }}>
                            <div style={{ fontSize: rank <= 3 ? "40px" : "32px", fontWeight: rank <= 3 ? 900 : 800, color: COLORS.charcoal }}>
                              {team.name}
                            </div>
                          </div>

                          <div style={{ fontSize: "38px", fontWeight: 900, color: COLORS.darkGreen }}>{team.points}</div>
                          <div style={{ fontSize: "38px", fontWeight: 900, color: COLORS.darkGreen }}>{team.differential}</div>
                          <div style={{ fontSize: "38px", fontWeight: 900, color: COLORS.darkGreen }}>{team.wins}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {showResetPrompt && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.4)",
              padding: "16px",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "420px",
                borderRadius: "16px",
                border: `1px solid ${COLORS.border}`,
                background: COLORS.white,
                padding: "24px",
                boxShadow: "0 10px 24px rgba(0,0,0,0.15)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: COLORS.darkGreen, marginBottom: "12px" }}>
                <ShieldAlert size={20} />
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800 }}>Confirm Reset</h2>
              </div>

              <p style={{ margin: "0 0 16px", fontSize: "14px", color: COLORS.charcoal }}>
                Enter the admin password to reset all tournament data.
              </p>

              <div style={{ display: "grid", gap: "8px" }}>
                <Label htmlFor="reset-modal-password">Reset password</Label>
                <Input
                  id="reset-modal-password"
                  type="password"
                  value={resetPasswordInput}
                  onChange={(e) => {
                    setResetPasswordInput(e.target.value);
                    setResetError("");
                  }}
                  placeholder="Enter reset password"
                  style={{ borderColor: COLORS.border, background: COLORS.white }}
                />
              </div>

              {resetError && (
                <div style={{ marginTop: "12px", fontSize: "14px", color: "#B91C1C" }}>
                  {resetError}
                </div>
              )}

              <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
                <Button onClick={confirmReset} style={{ background: COLORS.moss, color: COLORS.white }}>
                  Reset Tournament
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowResetPrompt(false);
                    setResetPasswordInput("");
                    setResetError("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
