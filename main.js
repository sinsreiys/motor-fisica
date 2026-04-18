// ==============================
// main.js — Lógica del mundo
// ==============================

const world = [];
const gravity = new Vector2D(0, 450);
const FRICTION = 0.998;

// --- ACTUALIZAR EL MUNDO ---
updateWorld = function(dt) {
    // 1. Aplicar gravedad y actualizar posiciones
    for (const body of world) {
        body.applyForce(gravity.multiply(body.mass));
        body.update(dt);
        body.velocity.x *= FRICTION;
        body.velocity.y *= FRICTION;
    }

    // 2. Colisiones con paredes
    for (const body of world) {
        if (body.position.y + body.radius > canvas.height) {
            body.position.y = canvas.height - body.radius;
            body.velocity.y *= -0.72;
        }
        if (body.position.y - body.radius < 0) {
            body.position.y = body.radius;
            body.velocity.y *= -0.72;
        }
        if (body.position.x + body.radius > canvas.width) {
            body.position.x = canvas.width - body.radius;
            body.velocity.x *= -0.72;
        }
        if (body.position.x - body.radius < 0) {
            body.position.x = body.radius;
            body.velocity.x *= -0.72;
        }
    }

    // 3. Colisiones entre cuerpos
    for (let i = 0; i < world.length; i++) {
        for (let j = i + 1; j < world.length; j++) {
            if (checkCollision(world[i], world[j])) {
                resolveCollision(world[i], world[j]);
            }
        }
    }
};

// --- DIBUJAR EL MUNDO ---
drawWorld = function() {
    // Dibujar todas las burbujas
    for (const body of world) {
        body.draw(ctx);
    }

    // Línea de apuntado si estamos lanzando
    if (isAiming) {
        const dx = aimStart.x - mousePos.x;
        const dy = aimStart.y - mousePos.y;
        const power = Math.min(Math.sqrt(dx * dx + dy * dy) / 250, 1);

        // Línea discontinua
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, 0.7)`;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 7]);
        ctx.beginPath();
        ctx.moveTo(aimStart.x, aimStart.y);
        ctx.lineTo(aimStart.x + dx * 0.85, aimStart.y + dy * 0.85);
        ctx.stroke();
        ctx.setLineDash([]);

        // Círculo de potencia en el punto de inicio
        ctx.beginPath();
        ctx.arc(aimStart.x, aimStart.y, 6 + power * 14, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 210, 80, ${0.25 + power * 0.5})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 210, 80, 0.9)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }

    // HUD: contador de burbujas en esquina superior izquierda
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.roundRect(16, 16, 140, 52, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '13px sans-serif';
    ctx.fillText(`Burbujas: ${world.length}`, 28, 38);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '11px sans-serif';
    ctx.fillText('Clic y arrastra para lanzar', 28, 56);
    ctx.restore();
};

// --- INICIALIZACIÓN ---
function init() {
    for (let i = 0; i < 15; i++) {
        const mass = Math.random() * 2.2 + 0.4;
        const body = new RigidBody(
            Math.random() * (canvas.width - 100) + 50,
            Math.random() * (canvas.height * 0.5) + 50,
            mass
        );
        body.velocity.x = (Math.random() - 0.5) * 180;
        body.velocity.y = Math.random() * 120;
        world.push(body);
    }
}

init();