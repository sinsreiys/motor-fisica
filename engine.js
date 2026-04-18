// ==============================
// engine.js — Motor de Física 2D
// ==============================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- VECTOR 2D ---
class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    add(v) { return new Vector2D(this.x + v.x, this.y + v.y); }
    multiply(s) { return new Vector2D(this.x * s, this.y * s); }
    dot(v) { return this.x * v.x + this.y * v.y; }
    length() { return Math.sqrt(this.x * this.x + this.y * this.y); }
}

// --- RIGID BODY ---
class RigidBody {
    constructor(x, y, mass) {
        this.position = new Vector2D(x, y);
        this.velocity = new Vector2D((Math.random() - 0.5) * 150, (Math.random() - 0.5) * 100);
        this.acceleration = new Vector2D(0, 0);
        this.mass = mass;
        this.invMass = mass > 0 ? 1 / mass : 0;
        this.radius = 10 + mass * 10;

        // Color aleatorio vivo para las burbujas
        const hue = Math.floor(Math.random() * 360);
        this.hue = hue;
        this.color = `hsl(${hue}, 75%, 60%)`;
        this.colorDark = `hsl(${hue}, 75%, 38%)`;
    }

    applyForce(force) {
        this.acceleration = this.acceleration.add(force.multiply(this.invMass));
    }

    update(dt) {
        this.velocity = this.velocity.add(this.acceleration.multiply(dt));
        this.position = this.position.add(this.velocity.multiply(dt));
        this.acceleration = new Vector2D(0, 0);
    }

    draw(ctx) {
        // Brillo interno tipo burbuja
        const gx = this.position.x - this.radius * 0.35;
        const gy = this.position.y - this.radius * 0.35;

        // Cuerpo principal con gradiente radial
        const grad = ctx.createRadialGradient(gx, gy, this.radius * 0.05, this.position.x, this.position.y, this.radius);
        grad.addColorStop(0, `hsla(${this.hue}, 90%, 88%, 0.9)`);
        grad.addColorStop(0.4, `hsla(${this.hue}, 75%, 60%, 0.75)`);
        grad.addColorStop(1, `hsla(${this.hue}, 70%, 30%, 0.85)`);

        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Borde translúcido
        ctx.strokeStyle = `hsla(${this.hue}, 80%, 75%, 0.6)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Reflejo blanco pequeño (arriba-izquierda)
        const shine = ctx.createRadialGradient(gx, gy, 0, gx, gy, this.radius * 0.5);
        shine.addColorStop(0, 'rgba(255,255,255,0.55)');
        shine.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.arc(gx, gy, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = shine;
        ctx.fill();
    }
}

// --- DETECCIÓN DE COLISIONES ---
function checkCollision(a, b) {
    const dx = a.position.x - b.position.x;
    const dy = a.position.y - b.position.y;
    const minDist = a.radius + b.radius;
    return dx * dx + dy * dy < minDist * minDist;
}

// --- RESOLUCIÓN DE COLISIONES ---
function resolveCollision(a, b) {
    const dx = b.position.x - a.position.x;
    const dy = b.position.y - a.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    const nx = dx / dist;
    const ny = dy / dist;
    const rvx = b.velocity.x - a.velocity.x;
    const rvy = b.velocity.y - a.velocity.y;
    const velAlongNormal = rvx * nx + rvy * ny;
    if (velAlongNormal > 0) return;

    const restitution = 0.75;
    const j = -(1 + restitution) * velAlongNormal / (a.invMass + b.invMass);

    a.velocity.x -= j * a.invMass * nx;
    a.velocity.y -= j * a.invMass * ny;
    b.velocity.x += j * b.invMass * nx;
    b.velocity.y += j * b.invMass * ny;

    // Separar objetos solapados
    const overlap = (a.radius + b.radius) - dist;
    const sep = overlap / 2 + 0.5;
    a.position.x -= nx * sep;
    a.position.y -= ny * sep;
    b.position.x += nx * sep;
    b.position.y += ny * sep;
}

// --- FONDO CON GRADIENTE Y CUADRÍCULA ---
function drawBackground() {
    // Gradiente degradado
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a3a4a');
    gradient.addColorStop(1, '#0d1e28');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cuadrícula sutil
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// --- GAME LOOP ---
let lastTime = 0;
let accumulator = 0;
const FIXED_DT = 1 / 60;

function gameLoop(currentTime) {
    let frameTime = (currentTime - lastTime) / 1000;
    if (frameTime > 0.05) frameTime = 0.05; // cap para evitar explosiones
    lastTime = currentTime;

    accumulator += frameTime;
    while (accumulator >= FIXED_DT) {
        updateWorld(FIXED_DT);
        accumulator -= FIXED_DT;
    }

    // Dibujar
    drawBackground();
    drawWorld();

    requestAnimationFrame(gameLoop);
}

// Estas funciones se sobreescriben desde main.js
let updateWorld = (dt) => {};
let drawWorld = () => {};

// Variables del ratón (accesibles desde main.js)
let mousePos = new Vector2D(0, 0);
let isAiming = false;
let aimStart = new Vector2D(0, 0);

canvas.addEventListener('mousemove', (e) => {
    mousePos = new Vector2D(e.clientX, e.clientY);
    if (isAiming) {
        // Solo seguimiento, la lógica de dibujo está en drawWorld
    }
});

canvas.addEventListener('mousedown', (e) => {
    isAiming = true;
    aimStart = new Vector2D(e.clientX, e.clientY);
});

canvas.addEventListener('mouseup', (e) => {
    if (isAiming) {
        const end = new Vector2D(e.clientX, e.clientY);
        const mass = Math.random() * 2 + 0.5;
        const newBody = new RigidBody(aimStart.x, aimStart.y, mass);
        newBody.radius = 10 + mass * 10;
        // Velocidad: dirección opuesta al arrastre (como tirachinas)
        newBody.velocity = new Vector2D(
            (aimStart.x - end.x) * 0.22,
            (aimStart.y - end.y) * 0.22
        );
        world.push(newBody);
    }
    isAiming = false;
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Iniciar loop
requestAnimationFrame(gameLoop);