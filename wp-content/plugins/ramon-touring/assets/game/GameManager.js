import { EXIT, PHYSICS, SCORE } from './config.js';
import { livesRemaining, resolveCollisions, isShoulder } from './CollisionManager.js';
import { stepCamera } from './CameraController.js';
import { stepEnvironment, biomeLabel, regionAt } from './EnvironmentManager.js';
import { assignMission, checkMissionComplete, missionLabel, noteCombo, notePass, } from './MissionManager.js';
import { applyPassEvents, levelOf, resetPassTracking } from './ScoreManager.js';
import { createInitialTraffic, stepTraffic } from './TrafficManager.js';
import { stepVehicle } from './VehicleController.js';
import { approachMeters, ramp, stepRoute } from './RouteManager.js';
export function createRun(mode, environment = 'auto') {
    const { traffic, nextId } = createInitialTraffic(mode);
    resetPassTracking();
    const s = {
        yaw: 0,
        slip: 0,
        d: 0,
        x: 0,
        vx: 0,
        speed: PHYSICS.baseSpeed,
        steer: 0,
        time: 0,
        score: 0,
        hits: 0,
        combo: 0,
        comboTimer: 0,
        inv: PHYSICS.startInvulnerability,
        fork: EXIT.firstFork,
        branch: false,
        branchTime: 0,
        exitHold: 0,
        exit: 0,
        camX: 0,
        camY: 5.1,
        camZ: -14.5,
        fovBoost: 0,
        shake: 0,
        ended: false,
        mode,
        weather: 'clear',
        environment,
        biomeBlend: 0,
        regionId: 0,
        discovered: [],
        missionId: null,
        missionProgress: 0,
        missionTarget: 0,
        cleanTimer: 0,
        traffic,
        nextTrafficId: nextId,
    };
    if (mode === 'arcade')
        assignMission(s, []);
    return s;
}
export function simulateStep(s, sections, input, dt, now, en, completedMissions) {
    const prevLevel = levelOf(s);
    const rain = s.weather === 'rain';
    stepVehicle(s, input.steerAxis, input.brake, dt, rain);
    stepEnvironment(s, input.forcedEnv, input.weather);
    const passEvents = stepTraffic(s, dt);
    const pops = applyPassEvents(s, passEvents, now);
    for (const e of passEvents) {
        notePass(s);
        if (e.close || s.combo > 1)
            noteCombo(s);
    }
    const col = resolveCollisions(s);
    const route = stepRoute(s, sections, dt, input.confirmExit, input.isCoarsePointer, now, en);
    if (route.popup)
        pops.push(route.popup);
    const path = s.branch ? ramp(s.d - s.fork) : 0;
    stepCamera(s, path, input.cameraMode, dt, input.reduceMotion);
    if (s.cleanTimer >= 30 && s.mode === 'arcade') {
        const key = 'clean:' + Math.floor(s.time / 30);
        if (!s._cleanAwarded || s._cleanAwarded !== key) {
            s._cleanAwarded = key;
            s.score += SCORE.cleanStretch;
            pops.push({ text: en ? 'CLEAN' : 'LIMPIO', points: SCORE.cleanStretch, at: now });
            s.cleanTimer = 0;
        }
    }
    const mission = checkMissionComplete(s, completedMissions, now, en);
    if (mission.popup)
        pops.push(mission.popup);
    return {
        pops,
        enteredWorkshop: route.enteredWorkshop,
        exitIndex: route.exitIndex,
        hit: col.hit,
        gameOver: col.gameOver,
        levelUp: levelOf(s) > prevLevel,
        missionMessage: mission.message,
        completedMissions: mission.completed,
    };
}
export function hudSnapshot(s, sections, en) {
    const approach = approachMeters(s);
    return {
        speed: Math.round(s.speed),
        distance: (s.d / 1000).toFixed(2) + ' km',
        score: Math.floor(s.score),
        level: levelOf(s),
        lives: livesRemaining(s),
        livesText: s.mode === 'explore'
            ? en
                ? 'EXPLORE'
                : 'EXPLORAR'
            : '♥'.repeat(Math.max(0, 3 - s.hits)) + '♡'.repeat(Math.min(3, s.hits)),
        biome: biomeLabel(regionAt(s.d), en),
        exitName: sections[s.exit]?.name || '',
        approach,
        branch: s.branch,
        shoulder: isShoulder(s),
        mission: missionLabel(s.missionId, en),
        missionProgress: Math.min(s.missionTarget, Math.floor(s.missionProgress)),
        missionTarget: s.missionTarget,
        combo: s.combo,
        exitHold: s.exitHold,
    };
}
export function resumeFromWorkshop(s, sectionCount) {
    s.exit = (s.exit + 1) % Math.max(1, sectionCount);
    s.fork = s.d + (s.mode === 'explore' ? EXIT.exploreGap : 520);
    s.branch = false;
    s.branchTime = 0;
    s.exitHold = 0;
    s.x = 0;
    s.vx = 0;
    s.speed = 70;
    s.inv = PHYSICS.workshopInvulnerability;
}
