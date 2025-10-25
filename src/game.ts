const TILE_SIZE = 40;
const ORANGES = 3;
const GHOST_SPEED = 0.01;

enum Orientation {
    CORNER_RIGHT_DOWN = -1,
    CORNER_RIGHT_UP = -2,
    CORNER_LEFT_UP = -3,
    CORNER_LEFT_DOWN = -4,
    NONE = 0,
    RIGHT = 1,
    UP = 2,
    LEFT = 3,
    DOWN = 4,
};

export class Point {
    readonly x: number;
    readonly y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

export async function run(element: HTMLCanvasElement) {
    const context = element.getContext("2d", { alpha: true });

    const eaten = document.querySelector<HTMLSpanElement>("#eaten")!;
    const longnehead = document.querySelector<HTMLImageElement>("#longnehead")!;
    const longnelegs = document.querySelector<HTMLImageElement>("#longnelegs")!;
    // const longneneck = document.querySelector<HTMLImageElement>("#longneneck")!;
    const longnetail = document.querySelector<HTMLImageElement>("#longnetail")!;
    const longneturn = document.querySelector<HTMLImageElement>("#longneturn")!;
    const smork = document.querySelector<HTMLImageElement>("#smork")!;
    const orange = document.querySelector<HTMLImageElement>("#orange")!;
    const dragneghost = document.querySelector<HTMLImageElement>("#dragneghost")!;
    const button = document.querySelector<HTMLButtonElement>("#restart")!;

    let lastTick: DOMHighResTimeStamp = performance.now();
    let lastMove: DOMHighResTimeStamp = lastTick;
    let orientation: Orientation = Orientation.RIGHT;
    let ghost = 1;
    let count: number = 0;
    let ate = false;
    let speed = 1;
    let dead = false;
    let restart = false;

    const grid = Array(Math.floor(element.width / TILE_SIZE)).fill("").map(() => Array(Math.floor(element.height / TILE_SIZE)).fill("").map(() => false));
    const tail = [
        new Point((grid.at(0)?.length ?? 0) >> 1, grid.length >> 1),
        new Point(((grid.at(0)?.length ?? 0) >> 1) + 1, grid.length >> 1),
    ];

    function pointToCoordinates(point: Point) {
        return new Point(point.x * TILE_SIZE, point.y * TILE_SIZE);
    }

    function randomOrange() {
        const x = Math.floor(Math.random() * (grid.at(0)?.length ?? 0));
        const y = Math.floor(Math.random() * grid.length);

        if (x === tail.at(0)?.x && y === tail.at(0)?.y) return new Point(x > 0 ? x - 1 : x + 1, y);
        return new Point(x, y);
    }

    function eat(point: Point): boolean {
        if (!grid.at(point.y)?.at(point.x)) return false;

        ate = true;
        count++;
        eaten.innerText = `${count}`;
        speed = Math.log(count + 1) + 1;

        grid[point.y][point.x] = false;
        const orange = randomOrange();
        grid[orange.y][orange.x] = true;
        return true;
    }

    function getOrientation(origin: Point, to: Point): Orientation {
        if (
            origin.x === to.x - 1
            && origin.y === to.y
        ) return Orientation.RIGHT;

        if (
            origin.x === to.x
            && origin.y === to.y - 1
        ) return Orientation.UP;

        if (
            origin.x === to.x + 1
            && origin.y === to.y
        ) return Orientation.LEFT;

        if (
            origin.x === to.x
            && origin.y === to.y + 1
        ) return Orientation.DOWN;

        return Orientation.NONE;
    }

    function getSectionOrientation(tail: Array<Point>, index: number): Orientation {
        if (index === 0 || index === tail.length - 1) return Orientation.NONE;

        const first = tail.at(index - 1)!;
        const middle = tail.at(index)!;
        const last = tail.at(index + 1)!;

        const firstOrientation = getOrientation(middle, first);
        const lastOrientation = getOrientation(middle, last);

        if (
            firstOrientation === Orientation.RIGHT
            && lastOrientation === Orientation.LEFT
        ) return Orientation.RIGHT;

        if (
            firstOrientation === Orientation.UP
            && lastOrientation === Orientation.DOWN
        ) return Orientation.UP;

        if (
            firstOrientation === Orientation.LEFT
            && lastOrientation === Orientation.RIGHT
        ) return Orientation.LEFT;

        if (
            firstOrientation === Orientation.DOWN
            && lastOrientation === Orientation.UP
        ) return Orientation.DOWN;

        if (
            (
                firstOrientation === Orientation.DOWN
                && lastOrientation === Orientation.RIGHT
            )
            || (
                lastOrientation === Orientation.DOWN
                && firstOrientation === Orientation.RIGHT
            )
        ) return Orientation.CORNER_RIGHT_DOWN;

        if (
            (
                firstOrientation === Orientation.UP
                && lastOrientation === Orientation.RIGHT
            )
            || (
                lastOrientation === Orientation.UP
                && firstOrientation === Orientation.RIGHT
            )
        ) return Orientation.CORNER_RIGHT_UP;

        if (
            (
                firstOrientation === Orientation.UP
                && lastOrientation === Orientation.LEFT
            )
            || (
                lastOrientation === Orientation.UP
                && firstOrientation === Orientation.LEFT
            )
        ) return Orientation.CORNER_LEFT_UP;

        if (
            (
                firstOrientation === Orientation.DOWN
                && lastOrientation === Orientation.LEFT
            )
            || (
                lastOrientation === Orientation.DOWN
                && firstOrientation === Orientation.LEFT
            )
        ) return Orientation.CORNER_LEFT_DOWN;

        return Orientation.NONE;
    }

    function setRotation(orientation: Orientation, coordinates: Point) {
        if (orientation === Orientation.LEFT) return context?.rotate(0);

        context?.translate(coordinates.x + (TILE_SIZE >> 1), coordinates.y + (TILE_SIZE >> 1));
        if (orientation === Orientation.DOWN) context?.rotate(Math.PI * 0.5);
        if (orientation === Orientation.RIGHT) context?.rotate(Math.PI);
        if (orientation === Orientation.UP) context?.rotate(Math.PI * 1.5);
        context?.translate(-(coordinates.x + (TILE_SIZE >> 1)), -(coordinates.y + (TILE_SIZE >> 1)));
    }

    function drawTail(tail: Array<Point>) {
        if (tail.length < 2) throw new Error();

        const head = tail.at(0);
        if (head === undefined) throw new Error();

        const headCoordinates = pointToCoordinates(head);
        const headOrientation = getOrientation(tail.at(1)!, head);

        setRotation(headOrientation, headCoordinates);
        context?.drawImage(ate ? smork : longnehead, headCoordinates.x, headCoordinates.y, TILE_SIZE, TILE_SIZE);
        context?.setTransform(1, 0, 0, 1, 0, 0);

        for (let i = 1; i < tail.length - 1; i++) {
            const section = tail.at(i);
            if (section === undefined) throw new Error();

            const sectionCoordinates = pointToCoordinates(section);
            const sectionOrientation = getSectionOrientation(tail, i);

            switch (sectionOrientation) {
                case Orientation.CORNER_RIGHT_DOWN: {
                    setRotation(Orientation.RIGHT, sectionCoordinates);
                    context?.drawImage(longneturn, sectionCoordinates.x, sectionCoordinates.y, TILE_SIZE, TILE_SIZE);
                    break;
                }
                case Orientation.CORNER_RIGHT_UP: {
                    setRotation(Orientation.UP, sectionCoordinates);
                    context?.drawImage(longneturn, sectionCoordinates.x, sectionCoordinates.y, TILE_SIZE, TILE_SIZE);
                    break;
                }
                case Orientation.CORNER_LEFT_UP: {
                    setRotation(Orientation.LEFT, sectionCoordinates);
                    context?.drawImage(longneturn, sectionCoordinates.x, sectionCoordinates.y, TILE_SIZE, TILE_SIZE);
                    break;
                }
                case Orientation.CORNER_LEFT_DOWN: {
                    setRotation(Orientation.DOWN, sectionCoordinates);
                    context?.drawImage(longneturn, sectionCoordinates.x, sectionCoordinates.y, TILE_SIZE, TILE_SIZE);
                    break;
                }
                default: {
                    if (sectionOrientation === Orientation.NONE) break;

                    setRotation(sectionOrientation, sectionCoordinates);
                    // context?.translate(TILE_SIZE, 0);
                    // context?.scale(-1, 1);
                    context?.drawImage(longnelegs, sectionCoordinates.x, sectionCoordinates.y, TILE_SIZE, TILE_SIZE);
                    break;
                }
            }
            context?.setTransform(1, 0, 0, 1, 0, 0);
        }

        const end = tail.at(tail.length - 1);
        if (end === undefined) throw new Error();

        const endCoordinates = pointToCoordinates(end);
        const endOrientation = getOrientation(end, tail.at(tail.length - 2)!);

        setRotation(endOrientation, endCoordinates);
        context?.drawImage(longnetail, endCoordinates.x, endCoordinates.y, TILE_SIZE, TILE_SIZE);
        context?.setTransform(1, 0, 0, 1, 0, 0);
    }

    function drawOranges(grid: Array<Array<boolean>>) {
        for (let y = 0; y < grid.length; y++) for (let x = 0; x < (grid.at(y)?.length ?? 0); x++) if (grid.at(y)?.at(x)) {
            const coordinates = pointToCoordinates(new Point(x, y));
            // context!.fillStyle = "#ffffff";
            context?.drawImage(orange, coordinates.x + (TILE_SIZE >> 2), coordinates.y + (TILE_SIZE >> 2), TILE_SIZE >> 1, TILE_SIZE >> 1);
        }
    }

    for (let i = 0; i < ORANGES; i++) {
        const orange = randomOrange();
        if (grid.at(orange.y)?.at(orange.x) === false) grid[orange.y][orange.x] = true;
        else i--;
    }

    window.addEventListener("keydown", event => {
        switch (event.key) {
            case "d": case "D": case "ArrowRight": {
                orientation = Orientation.RIGHT;
                break;
            }
            case "w": case "W": case "ArrowUp": {
                orientation = Orientation.UP;
                break;
            }
            case "a": case "A": case "ArrowLeft": {
                orientation = Orientation.LEFT;
                break;
            }
            case "s": case "S": case "ArrowDown": {
                orientation = Orientation.DOWN;
                break;
            }
        }
    });

    button.addEventListener("click", () => {
        restart = true;
    });

    function update(timestamp: DOMHighResTimeStamp) {
        if (restart) {
            restart = false;
            run(element);
            return;
        }

        const scalar = (timestamp - lastTick) / 1000;
        const elapsed = (timestamp - lastMove) / 1000;
        const threshold = 1 / speed;

        if (!dead && elapsed > threshold) {
            lastMove = timestamp;
            const head = tail.at(0);
            if (head === undefined) throw new Error();

            const currentOrientation = getOrientation(tail.at(1)!, head);
            let move: Point | undefined;

            switch (currentOrientation) {
                case Orientation.RIGHT: {
                    if (orientation === Orientation.UP) {
                        move = new Point(head.x, head.y - 1);
                        break;
                    }
                    if (orientation === Orientation.DOWN) {
                        move = new Point(head.x, head.y + 1);
                        break;
                    }
                    move = new Point(head.x + 1, head.y);
                    break;
                }
                case Orientation.UP: {
                    if (orientation === Orientation.RIGHT) {
                        move = new Point(head.x + 1, head.y);
                        break;
                    }
                    if (orientation === Orientation.LEFT) {
                        move = new Point(head.x - 1, head.y);
                        break;
                    }
                    move = new Point(head.x, head.y + 1);
                    break;
                }
                case Orientation.LEFT: {
                    if (orientation === Orientation.UP) {
                        move = new Point(head.x, head.y - 1);
                        break;
                    }
                    if (orientation === Orientation.DOWN) {
                        move = new Point(head.x, head.y + 1);
                        break;
                    }
                    move = new Point(head.x - 1, head.y);
                    break;
                }
                case Orientation.DOWN: {
                    if (orientation === Orientation.RIGHT) {
                        move = new Point(head.x + 1, head.y);
                        break;
                    }
                    if (orientation === Orientation.LEFT) {
                        move = new Point(head.x - 1, head.y);
                        break;
                    }
                    move = new Point(head.x, head.y - 1);
                    break;
                }
            }

            if (move === undefined) throw new Error();

            if (
                move.x < 0
                || move.x >= (grid.at(0)?.length ?? 0)
                || move.y < 0
                || move.y >= grid.length
                || tail.findIndex(point => point.x === move.x && point.y === move.y) !== -1
            ) dead = true;
            else {
                ate = false;
                tail.unshift(move);
                if (!eat(move)) tail.pop();
            }
        }

        context?.clearRect(0, 0, element.width, element.height);

        drawTail(tail);
        drawOranges(grid);

        if (dead) {
            if (ghost < 4) ghost += GHOST_SPEED * scalar;
            if (ghost >= 4) ghost = 4;
            const size = TILE_SIZE * ghost;
            context?.drawImage(dragneghost, (element.width >> 1) - (size / 2), (element.height >> 1) - (size / 2), size, size);
        }

        setTimeout(() => requestAnimationFrame(update), 10);
    }

    update(lastTick);
}
