import { ObstacleType } from '../objects/Obstacle';

/**
 * Hand-placed level layouts. Every adventure level used to scatter its food, poison and
 * batteries at random (and two levels added random bushes), so a run could put food inside a
 * bush, under the HUD, or nowhere near a box to hide in. These layouts are designed per map:
 *
 *  - the cat starts in a quiet corner with an easy first pickup nearby;
 *  - every risky stretch (next to a sleeping dog or across a roaming dog's lane) has a box
 *    within a short dash;
 *  - poison sits near food as a decoy, never on the only way through;
 *  - nothing you need to collect sits under the top HUD (y < 90) or in the bottom corners
 *    where the touch controls are.
 *
 * The world is 1000 x 600. Coordinates are sprite centres, except snowmen, which are placed
 * by their top-left corner.
 */

export type Point = { x: number; y: number };
export type DogPlacement = Point & { behavior: 'SLEEP' | 'ROAM' };
export type ObstaclePlacement = Point & { type: ObstacleType; scale: number; flip?: boolean };

export interface LevelLayout {
    player: Point;
    dogs: DogPlacement[];
    house?: Point & { flip?: boolean };
    obstacles: ObstaclePlacement[];
    boxes: Point[];
    food: Point[];
    poison: Point[];
    batteries?: Point[];
}

/** Meadow: learn to sneak. Two sleepers by their houses, two roamers crossing the middle. */
export const LEVEL_1: LevelLayout = {
    player: { x: 110, y: 140 },
    house: { x: 230, y: 330, flip: true },
    dogs: [
        { x: 300, y: 372, behavior: 'SLEEP' },
        { x: 560, y: 190, behavior: 'ROAM' },
        { x: 880, y: 330, behavior: 'SLEEP' },
        { x: 640, y: 470, behavior: 'ROAM' }
    ],
    obstacles: [
        // Treeline along the top edge.
        { type: 'tree', x: 300, y: 70, scale: 0.18 },
        { type: 'tree', x: 560, y: 62, scale: 0.2 },
        { type: 'tree', x: 820, y: 72, scale: 0.18 },
        // Hedge along the dark band at the bottom of the map.
        { type: 'tree', x: 90, y: 565, scale: 0.2 },
        { type: 'tree', x: 420, y: 570, scale: 0.18 },
        { type: 'tree', x: 760, y: 565, scale: 0.2 },
        // A bush pair in the middle to break line of sight, and a few single bushes.
        { type: 'bush', x: 470, y: 330, scale: 0.42 },
        { type: 'bush', x: 525, y: 345, scale: 0.36, flip: true },
        { type: 'tree', x: 730, y: 250, scale: 0.17 },
        { type: 'bush', x: 360, y: 470, scale: 0.36 },
        { type: 'tree', x: 940, y: 470, scale: 0.17 }
    ],
    boxes: [
        { x: 400, y: 200 },
        { x: 650, y: 360 },
        { x: 860, y: 200 },
        { x: 200, y: 470 }
    ],
    food: [
        { x: 250, y: 160 },
        { x: 500, y: 250 },
        { x: 780, y: 150 },
        { x: 820, y: 430 },
        { x: 480, y: 450 }
    ],
    poison: [
        { x: 600, y: 270 },
        { x: 360, y: 280 },
        { x: 920, y: 140 },
        { x: 560, y: 520 }
    ]
};

/** Snow: everything orbits the campfire. Food sits out in the cold; boxes and the fire are the safe spots. */
export const LEVEL_2: LevelLayout & { fire: Point; snowmen: (Point & { flip?: boolean })[] } = {
    player: { x: 150, y: 150 },
    fire: { x: 500, y: 300 },
    house: { x: 500, y: 525 },
    snowmen: [
        { x: 30, y: 280 },
        { x: 860, y: 430, flip: true }
    ],
    dogs: [
        { x: 395, y: 545, behavior: 'SLEEP' },
        { x: 740, y: 280, behavior: 'ROAM' },
        { x: 820, y: 140, behavior: 'SLEEP' }
    ],
    obstacles: [
        // A ring of snowy bushes around the fire, with gaps on all four sides.
        { type: 'bushsnow', x: 380, y: 215, scale: 0.15 },
        { type: 'bushsnow', x: 625, y: 210, scale: 0.15, flip: true },
        { type: 'bushsnow', x: 370, y: 395, scale: 0.15, flip: true },
        { type: 'bushsnow', x: 630, y: 400, scale: 0.15 },
        // Edges.
        { type: 'bushsnow', x: 650, y: 95, scale: 0.13 },
        { type: 'bushsnow', x: 250, y: 330, scale: 0.13 },
        { type: 'bushsnow', x: 200, y: 540, scale: 0.14 }
    ],
    boxes: [
        { x: 330, y: 120 },
        { x: 720, y: 520 },
        { x: 860, y: 250 },
        { x: 150, y: 430 }
    ],
    food: [
        { x: 270, y: 200 },
        { x: 500, y: 140 },
        { x: 760, y: 120 },
        { x: 930, y: 180 },
        { x: 790, y: 420 },
        { x: 600, y: 540 },
        { x: 290, y: 470 },
        { x: 110, y: 560 },
        { x: 500, y: 410 },
        { x: 690, y: 300 }
    ],
    poison: [
        { x: 440, y: 110 },
        { x: 560, y: 220 },
        { x: 910, y: 380 },
        { x: 300, y: 560 },
        { x: 230, y: 410 },
        { x: 660, y: 470 }
    ]
};

/** Night: you only see what the flashlight shows, so pickups follow paths that batteries light up. */
export const LEVEL_3: LevelLayout = {
    player: { x: 120, y: 500 },
    dogs: [
        { x: 300, y: 270, behavior: 'SLEEP' },
        { x: 640, y: 160, behavior: 'ROAM' },
        { x: 560, y: 430, behavior: 'ROAM' },
        { x: 870, y: 330, behavior: 'SLEEP' }
    ],
    obstacles: [
        { type: 'tree', x: 150, y: 70, scale: 0.19 },
        { type: 'tree', x: 420, y: 62, scale: 0.2 },
        { type: 'tree', x: 700, y: 70, scale: 0.18 },
        { type: 'tree', x: 930, y: 65, scale: 0.19 },
        { type: 'bushsnow', x: 90, y: 300, scale: 0.14 },
        { type: 'tree', x: 420, y: 330, scale: 0.18 },
        { type: 'bushsnow', x: 470, y: 200, scale: 0.14, flip: true },
        { type: 'tree', x: 740, y: 260, scale: 0.18 },
        { type: 'bushsnow', x: 300, y: 560, scale: 0.14 },
        { type: 'tree', x: 700, y: 545, scale: 0.18 },
        { type: 'bushsnow', x: 930, y: 520, scale: 0.14, flip: true }
    ],
    boxes: [
        { x: 230, y: 380 },
        { x: 380, y: 140 },
        { x: 630, y: 330 },
        { x: 830, y: 460 },
        { x: 880, y: 180 }
    ],
    food: [
        { x: 220, y: 480 },
        { x: 120, y: 380 },
        { x: 200, y: 170 },
        { x: 310, y: 380 },
        { x: 540, y: 120 },
        { x: 560, y: 260 },
        { x: 470, y: 470 },
        { x: 600, y: 540 },
        { x: 780, y: 140 },
        { x: 800, y: 360 },
        { x: 950, y: 260 },
        { x: 950, y: 420 },
        { x: 820, y: 560 },
        { x: 350, y: 470 },
        { x: 680, y: 420 }
    ],
    poison: [
        { x: 260, y: 110 },
        { x: 380, y: 250 },
        { x: 660, y: 230 },
        { x: 720, y: 470 },
        { x: 900, y: 120 },
        { x: 470, y: 560 },
        { x: 150, y: 250 }
    ],
    batteries: [
        { x: 180, y: 560 },
        { x: 120, y: 200 },
        { x: 330, y: 200 },
        { x: 480, y: 410 },
        { x: 520, y: 330 },
        { x: 640, y: 100 },
        { x: 700, y: 360 },
        { x: 880, y: 250 },
        { x: 900, y: 560 },
        { x: 560, y: 470 }
    ]
};

/** Storm: lightning chases you, so keep moving; mud slows you, so plan routes around it. */
export const LEVEL_4: LevelLayout & { mud: (Point & { width: number; height: number })[] } = {
    player: { x: 110, y: 510 },
    dogs: [
        { x: 260, y: 290, behavior: 'SLEEP' },
        { x: 760, y: 150, behavior: 'ROAM' },
        { x: 520, y: 300, behavior: 'SLEEP' },
        { x: 640, y: 450, behavior: 'ROAM' }
    ],
    mud: [
        { x: 210, y: 190, width: 80, height: 60 },
        { x: 450, y: 170, width: 100, height: 70 },
        { x: 700, y: 230, width: 90, height: 65 },
        { x: 330, y: 400, width: 110, height: 75 },
        { x: 560, y: 410, width: 85, height: 60 },
        { x: 840, y: 350, width: 95, height: 70 },
        { x: 230, y: 500, width: 100, height: 65 },
        { x: 700, y: 520, width: 90, height: 70 }
    ],
    obstacles: [
        { type: 'tree', x: 130, y: 70, scale: 0.19 },
        { type: 'tree', x: 340, y: 62, scale: 0.18 },
        { type: 'tree', x: 600, y: 70, scale: 0.2 },
        { type: 'tree', x: 880, y: 65, scale: 0.19 },
        { type: 'tree', x: 90, y: 330, scale: 0.16 },
        { type: 'tree', x: 400, y: 280, scale: 0.17 },
        { type: 'tree', x: 650, y: 330, scale: 0.18 },
        { type: 'tree', x: 930, y: 230, scale: 0.17 },
        { type: 'tree', x: 470, y: 560, scale: 0.17 },
        { type: 'tree', x: 920, y: 520, scale: 0.18 }
    ],
    boxes: [
        { x: 160, y: 410 },
        { x: 330, y: 160 },
        { x: 560, y: 210 },
        { x: 800, y: 440 },
        { x: 470, y: 470 },
        { x: 860, y: 140 }
    ],
    food: [
        { x: 230, y: 420 },
        { x: 120, y: 230 },
        { x: 260, y: 120 },
        { x: 330, y: 250 },
        { x: 440, y: 360 },
        { x: 460, y: 110 },
        { x: 560, y: 120 },
        { x: 630, y: 170 },
        { x: 720, y: 120 },
        { x: 800, y: 260 },
        { x: 950, y: 140 },
        { x: 950, y: 320 },
        { x: 940, y: 430 },
        { x: 820, y: 540 },
        { x: 590, y: 520 },
        { x: 380, y: 520 },
        { x: 120, y: 450 },
        { x: 720, y: 400 },
        { x: 470, y: 245 },
        { x: 210, y: 250 }
    ],
    poison: [
        { x: 200, y: 330 },
        { x: 380, y: 200 },
        { x: 520, y: 520 },
        { x: 640, y: 250 },
        { x: 740, y: 320 },
        { x: 880, y: 270 },
        { x: 860, y: 520 },
        { x: 600, y: 410 }
    ]
};

/**
 * Tutorial: one sleeping dog by its house and one roaming dog that starts far away, so you can
 * try sneaking, hiding and jumping before anything chases you.
 */
export const TUTORIAL: LevelLayout = {
    player: { x: 500, y: 300 },
    house: { x: 280, y: 290, flip: true },
    dogs: [
        { x: 340, y: 330, behavior: 'SLEEP' },
        { x: 870, y: 500, behavior: 'ROAM' }
    ],
    obstacles: [
        { type: 'tree', x: 150, y: 120, scale: 0.24 },
        { type: 'tree', x: 760, y: 150, scale: 0.26 },
        { type: 'tree', x: 420, y: 520, scale: 0.24 },
        { type: 'tree', x: 90, y: 470, scale: 0.22 },
        { type: 'tree', x: 930, y: 300, scale: 0.22 }
    ],
    boxes: [
        { x: 620, y: 400 },
        { x: 260, y: 470 },
        { x: 760, y: 290 }
    ],
    food: [
        { x: 600, y: 230 },
        { x: 420, y: 180 },
        { x: 700, y: 480 },
        { x: 860, y: 180 },
        { x: 200, y: 200 },
        { x: 160, y: 380 },
        { x: 560, y: 520 },
        { x: 900, y: 420 }
    ],
    poison: [
        { x: 520, y: 150 },
        { x: 340, y: 430 },
        { x: 820, y: 360 },
        { x: 250, y: 120 }
    ]
};

/**
 * Custom levels: the player picks the map, the mechanics and how many dogs, food, poison and
 * batteries there are, so instead of a fixed layout they get a designed base:
 *
 *  - obstacles and boxes per map, keeping the centre clear for the snow campfire and the two
 *    snowman spots free, since snow can be added to any map;
 *  - dog spots in the order dogs are added (sleepers and roamers alternate);
 *  - item spots on an even, slightly staggered grid that avoids everything above, used in order
 *    for food, then poison, then batteries. Counts beyond the spots fall back to spaced-out
 *    random placement.
 */
export const CUSTOM_SNOW = {
    fire: { x: 500, y: 300 },
    snowmen: [
        { x: 30, y: 280 },
        { x: 860, y: 430, flip: true }
    ]
};

export const CUSTOM_BASE = {
    player: { x: 110, y: 140 },
    /** Meadow and snow maps have a dog house; the night map doesn't. */
    house: { x: 220, y: 330, flip: true },
    boxes: [
        { x: 330, y: 150 },
        { x: 700, y: 160 },
        { x: 240, y: 440 },
        { x: 740, y: 470 }
    ],
    dogs: [
        { x: 300, y: 330, behavior: 'SLEEP' },
        { x: 790, y: 300, behavior: 'ROAM' },
        { x: 520, y: 480, behavior: 'SLEEP' },
        { x: 870, y: 170, behavior: 'ROAM' },
        { x: 180, y: 240, behavior: 'SLEEP' },
        { x: 620, y: 540, behavior: 'ROAM' },
        { x: 440, y: 150, behavior: 'SLEEP' },
        { x: 920, y: 330, behavior: 'ROAM' },
        { x: 360, y: 530, behavior: 'SLEEP' },
        { x: 600, y: 110, behavior: 'ROAM' }
    ] as DogPlacement[]
};

export function customObstacles(map: string): ObstaclePlacement[] {
    const edge = map === 'level2_map' ? 'bushsnow' : 'tree';
    const inner: ObstacleType = map === 'level1_map' ? 'bush' : map === 'level2_map' ? 'bushsnow' : 'tree';
    const innerScale = inner === 'bush' ? 0.4 : inner === 'bushsnow' ? 0.14 : 0.18;
    const edgeScale = edge === 'bushsnow' ? 0.13 : 0.19;
    return [
        { type: edge, x: 270, y: 70, scale: edgeScale },
        { type: edge, x: 560, y: 62, scale: edgeScale },
        { type: edge, x: 820, y: 72, scale: edgeScale },
        { type: edge, x: 90, y: 565, scale: edgeScale },
        { type: edge, x: 470, y: 570, scale: edgeScale },
        { type: edge, x: 680, y: 565, scale: edgeScale },
        { type: inner, x: 380, y: 250, scale: innerScale },
        { type: inner, x: 640, y: 380, scale: innerScale, flip: true },
        { type: inner, x: 930, y: 250, scale: innerScale }
    ];
}

/** Item spots for custom levels, in the order they're used. */
export function customItemSpots(map: string, withSnow: boolean): Point[] {
    const blocked: (Point & { r: number })[] = [
        { ...CUSTOM_BASE.player, r: 90 },
        { ...CUSTOM_BASE.house, r: 85 },
        ...CUSTOM_BASE.boxes.map(b => ({ ...b, r: 60 })),
        ...CUSTOM_BASE.dogs.map(d => ({ x: d.x, y: d.y, r: 55 })),
        ...customObstacles(map).map(o => ({ x: o.x, y: o.y, r: 50 })),
        ...(withSnow ? [
            { ...CUSTOM_SNOW.fire, r: 75 },
            { x: 95, y: 340, r: 80 },
            { x: 925, y: 490, r: 80 }
        ] : [])
    ];
    const spots: Point[] = [];
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 8; col++) {
            // A staggered grid: every other row shifts right, so pickups don't line up in columns.
            const p = { x: 130 + col * 110 + (row % 2) * 55, y: 120 + row * 100 };
            if (p.x > 940) continue;
            if (blocked.some(b => Math.hypot(b.x - p.x, b.y - p.y) < b.r)) continue;
            spots.push(p);
        }
    }
    // Spread the order out so the first few spots aren't all in one corner.
    const order = [0, 7, 3, 10, 5, 1, 8, 4, 11, 6, 2, 9];
    return spots
        .map((p, i) => ({ p, key: order[i % order.length] * 100 + i }))
        .sort((a, b) => a.key - b.key)
        .map(({ p }) => p);
}
