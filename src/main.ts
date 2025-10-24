import "./style.css";
import { run } from "./game.js";
import longnehead from "/longnehead.png?url";
import longnelegs from "/longnelegs.png?url";
import longneneck from "/longneneck.png?url";
import longnetail from "/longnetail.png?url";
import longneturn from "/longneturn.png?url";
import smork from "/smork.png?url";
import orange from "/orange.svg?url";
import dragneghost from "/dragneghost.webp?url";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <div style="display: none;" >
        <img id="longnehead" src=${longnehead} >
        <img id="longnelegs" src=${longnelegs} >
        <img id="longneneck" src=${longneneck} >
        <img id="longnetail" src=${longnetail} >
        <img id="longneturn" src=${longneturn} >
        <img id="smork" src=${smork} >
        <img id="orange" src=${orange} >
        <img id="dragneghost" src=${dragneghost} >
    </div>
    <div style="border: 1px solid black; background-color: teal; padding: 8px; display: flex; flex-direction: row; justify-content: space-between;" >
        <div style="display: flex; flex-direction: column; align-items: start;" >
            <div>Oranges eaten: <span id="eaten">0</span></div>
            <div>WASD or arrow keys to navigate.</div>
        </div>
        <button id="restart">Restart</button>
    </div>
    <canvas id="dragne-game" width="520" height="520" style="border: 1px solid blue" ></canvas>
`;

run(document.querySelector<HTMLCanvasElement>("#dragne-game")!);
