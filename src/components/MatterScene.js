import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import * as decomp from 'poly-decomp';

if (typeof window !== 'undefined') {
  window.decomp = decomp;
  Matter.Common.setDecomp(decomp);
}

const MatterScene = () => {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const runnerRef = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const {
      Engine,
      Render,
      World,
      Bodies,
      Body,
      Mouse,
      MouseConstraint,
      Events,
      Runner,
    } = Matter;

    const container = sceneRef.current;
    const engine = Engine.create();
    const world = engine.world;
    const runner = Runner.create();
    engineRef.current = engine;
    runnerRef.current = runner;

    const render = Render.create({
      element: container,
      engine,
      options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: '#F7F2EA',
      },
    });

    Object.assign(render.canvas.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      zIndex: '0',
      pointerEvents: 'auto',
    });

    Render.run(render); // ⚠️ Runner는 아직 실행하지 않음

    const soundPaths = [
      '/sound/for_site/for_home/Crystal_Ping.mp3',
      '/sound/for_site/for_home/Glass_Tinkle.mp3',
      '/sound/for_site/for_home/Metallic_Clink.mp3',
      '/sound/for_site/for_home/Muted_Xylo_Tap_3.mp3',
      '/sound/for_site/for_home/Paper_Snap.mp3',
      '/sound/for_site/for_home/Piano_High_Key.mp3',
      '/sound/for_site/for_home/Pop.mp3',
      '/sound/for_site/for_home/Soft_Harp_Pluck.mp3',
      '/sound/for_site/for_home/Tiny_Bell_Ding.mp3',
      '/sound/for_site/for_home/Wood_Knock.mp3',
    ];
    const sounds = soundPaths.map((src) => new Audio(src));

    const shapes = [];

    const createHalfCircle = (x, y, radius, segments, color) => {
      const angleStep = Math.PI / segments;
      const vertices = [{ x: 0, y: 0 }];
      for (let i = 0; i <= segments; i++) {
        const angle = Math.PI - i * angleStep;
        vertices.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
      }
      const translatedVertices = vertices.map((v) => ({ x: v.x + x, y: v.y + y }));
      return Bodies.fromVertices(x, y, [translatedVertices], {
        restitution: 0.7,
        friction: 0.3,
        render: { fillStyle: color },
      }, true);
    };

    shapes.push(createHalfCircle(600, -300, 200, 40, '#F5BC62'));

    const donut = Body.create({
      parts: [
        Bodies.circle(900, -300, 60, {
          restitution: 0.7,
          friction: 0.3,
          render: { fillStyle: '#F5BC62' },
        }),
        Bodies.circle(900, -300, 30, {
          isSensor: true,
          render: { fillStyle: '#F7F2EA' },
        }),
      ],
    });
    shapes.push(donut);

    shapes.push(Bodies.rectangle(400, -300, 120, 420, { restitution: 0.7, friction: 0.3, render: { fillStyle: '#4284F3' } }));
    shapes.push(Bodies.polygon(800, -300, 3, 80, { restitution: 0.7, friction: 0.3, render: { fillStyle: '#6EC1A1' } }));
    shapes.push(Bodies.rectangle(1000, -300, 98, 40, { restitution: 0.7, friction: 0.3, render: { fillStyle: '#EF7A88' } }));
    shapes.push(Bodies.circle(1000, -300, 43.5, { restitution: 0.7, friction: 0.3, render: { fillStyle: '#FE6E3D' } }));
    shapes.push(Bodies.circle(1000, -300, 82, { restitution: 0.7, friction: 0.3, render: { fillStyle: '#EF7A88' } }));
    shapes.push(Bodies.rectangle(1000, -300, 64, 66, { restitution: 0.7, friction: 0.3, render: { fillStyle: '#6EC1A1' } }));

    const starParts = (cx, cy, w, h, color) => {
      const parts = [];
      for (let i = 0; i < 12; i++) {
        const angle = (i * 30 * Math.PI) / 180;
        const rect = Bodies.rectangle(cx, cy, w, h, { render: { fillStyle: color } });
        Body.setAngle(rect, angle);
        parts.push(rect);
        parts.push(
          Bodies.circle(cx + Math.sin(angle) * h / 2, cy - Math.cos(angle) * h / 2, w / 2, { render: { fillStyle: color } }),
          Bodies.circle(cx - Math.sin(angle) * h / 2, cy + Math.cos(angle) * h / 2, w / 2, { render: { fillStyle: color } })
        );
      }
      return Body.create({ parts, restitution: 0.7, friction: 0.3 });
    };

    shapes.push(starParts(600, -500, 4, 210, '#FE6E3D'));
    shapes.push(starParts(1000, -500, 19, 210, '#4284F3'));

    const walls = [
      Bodies.rectangle(-50, window.innerHeight / 2, 100, window.innerHeight, { isStatic: true, render: { visible: false } }),
      Bodies.rectangle(window.innerWidth + 50, window.innerHeight / 2, 100, window.innerHeight, { isStatic: true, render: { visible: false } }),
      Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 50, window.innerWidth, 100, { isStatic: true, render: { visible: false } }),
    ];
    World.add(world, [...shapes, ...walls]);

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.2, render: { visible: false } },
    });
    World.add(world, mouseConstraint);

    mouse.pixelRatio = render.options.pixelRatio;
    mouse.element.removeEventListener('wheel', mouse.mousewheel);
    mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);

    Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach(({ bodyA, bodyB }) => {
        [bodyA, bodyB].forEach((body) => {
          const index = shapes.indexOf(body);
          if (index !== -1 && sounds[index] && sounds[index].paused) {
            sounds[index].currentTime = 0;
            sounds[index].play().catch(() => {});
          }
        });
      });
    });

    Events.on(mouseConstraint, 'mousedown', (event) => {
      const clickedBody = event.source.body;
      const index = shapes.indexOf(clickedBody);
      if (index !== -1 && sounds[index] && sounds[index].paused) {
        sounds[index].currentTime = 0;
        sounds[index].play().catch(() => {});
      }
    });

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      World.clear(world);
      Engine.clear(engine);
      render.canvas.remove();
    };
  }, []);

  const handleStart = () => {
    const runner = runnerRef.current;
    const engine = engineRef.current;

    setHasStarted(true);

    const sounds = document.querySelectorAll('audio');
    sounds.forEach((audio) => {
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
      }).catch(() => {});
    });

    Matter.Runner.run(runner, engine);
  };

  return (
    <div ref={sceneRef} style={{ width: '100vw', height: '100vh' }} onClick={!hasStarted ? handleStart : undefined}>
      {!hasStarted && (
        <div style={{
          position: 'absolute',
          top: '60%',
          left: '80%',
          transform: 'translate(-50%, -50%)',
          fontSize: '22px',
          fontFamily: 'Loos Extended',
          fontWeight: '400',
          color: '#333',
          zIndex: 10,
          pointerEvents: 'none',
          opacity: hasStarted ? 0 : 1,
          transition: 'opacity 1s ease',
        }}>Click to Start</div>
      )}
    </div>
  );
};

export default MatterScene;
