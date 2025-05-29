import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import "./soundBuilder.css";
import { toPng } from "html-to-image";
import download from "downloadjs";


const SHAPES_BY_CATEGORY = {
  박자: Array.from({ length: 9 }, (_, i) => `박자-${i + 1}`),
  음계: Array.from({ length: 18 }, (_, i) => `음계-${i + 1}`),
  배경음: Array.from({ length: 5 }, (_, i) => `배경음-${i + 1}`),
  강세: Array.from({ length: 5 }, (_, i) => `강세-${i + 1}`),
};

const CATEGORIES = ["박자", "음계", "배경음", "강세"];
const PITCH_ORDER = ["C", "D", "E", "F", "G", "A", "B", "C'"];
const NUM_PITCH_LINES = 8;
const LINE_SPACING = 40;
const SNAP_THRESHOLD = 8;
const PLAYBACK_DURATION = 15000;

const initialShape = (xPercent, yPercent, type = "박자-1", size = 40) => ({
  id: uuidv4(),
  xPercent,
  yPercent,
  type,
  size,
  group: null,
  pitch: "C",
  lastPlayed: 0,
  customColor: null,
});

const rhythmSounds = {
  "#4284F3": ["/sound/rhythm/blue/r1.mp3", "/sound/rhythm/blue/r2.mp3"],
  "#6EC1A1": ["/sound/rhythm/green/r4.mp3", "/sound/rhythm/green/r21.mp3"],
  "#F5BC62": ["/sound/rhythm/yellow/r5.mp3", "/sound/rhythm/yellow/r6.mp3"],
  "#FE6E3D": ["/sound/rhythm/orange/r7.mp3", "/sound/rhythm/orange/r8_01.mp3"],
  "#EF7A88": ["/sound/rhythm/pink/r16.mp3", "/sound/rhythm/pink/r17.mp3"],
};

const durationSounds = {
  "#4284F3": ["/sound/duration/blue/d5_01.mp3", "/sound/duration/blue/d11_01.mp3"],
  "#6EC1A1": ["/sound/duration/green/d1_01.mp3", "/sound/duration/green/d6_01.mp3"],
  "#FE6E3D": ["/sound/duration/orange/d4_01.mp3", "/sound/duration/orange/d7_01.mp3"],
  "#EF7A88": ["/sound/duration/pink/d24_01.mp3"],
  "#F5BC62": ["/sound/duration/yellow/d2_01.mp3", "/sound/duration/yellow/d3_01.mp3"],
};

const pitchGroups = {
  "#4284F3": ["p1", "p11", "p18", "p19"],
  "#6EC1A1": ["p13", "p16", "p22", "p29", "p30"],
  "#FE6E3D": ["p3"],
  "#EF7A88": ["p4", "p6", "p24", "p25", "p26"],
  "#F5BC62": ["p2", "p5", "p7", "p8", "p9", "p12", "p15", "p23"],
};

const getPitchFromY = (y, svgHeight) => {
  const centerY = svgHeight / 2;
  const index = Math.round((y - centerY) / LINE_SPACING + NUM_PITCH_LINES / 2);
  return PITCH_ORDER[Math.min(Math.max(index, 0), 7)];
};

const getClosestLeadY = (y, svgHeight) => {
  const centerY = svgHeight / 2;
  const leadYs = Array.from({ length: NUM_PITCH_LINES }, (_, i) => centerY + (i - 3.5) * LINE_SPACING);
  let closest = y;
  let minDiff = SNAP_THRESHOLD;
  for (let ly of leadYs) {
    const diff = Math.abs(y - ly);
    if (diff < minDiff) {
      closest = ly;
      minDiff = diff;
    }
  }
  return closest;
};

// 🟧 Matter.js starParts 기반 도형 SVG로 구현
const renderStarShapeFromMatter = (cx, cy, color = "black", isSelected) => {
  const elements = [];
  const w = 4;
  const h = 210;
  const strokeWidth = isSelected ? 5 : 3;

  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 * Math.PI) / 180;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);

    const x1 = cx;
    const y1 = cy;
    const x2 = cx + sin * (h * 0.5);
    const y2 = cy - cos * (h * 0.5);
    elements.push(
      <line key={`line-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={strokeWidth} />
    );

    elements.push(<circle key={`circle-a-${i}`} cx={x2} cy={y2} r={w / 2.8} fill={color} />);
    elements.push(<circle key={`circle-b-${i}`} cx={cx - sin * (h * 0.5)} cy={cy + cos * (h * 0.5)} r={w / 2.8} fill={color} />);
  }

  return <g>{elements}</g>;
};

const renderHollowStarShape = (cx, cy, color = "black", isSelected) => {
  const elements = [];
  const h = 140;
  const strokeWidth = isSelected ? 5 : 3;

  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 * Math.PI) / 180;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);

    const x1 = cx + sin * 40; // 중심에서 약간 떨어진 시작점
    const y1 = cy - cos * 40;
    const x2 = cx + sin * (h * 0.5);
    const y2 = cy - cos * (h * 0.5);

    elements.push(
      <line
        key={`hollow-line-${i}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    );
  }

  return <g>{elements}</g>;
};

const renderCompactStarShape = (
  cx,
  cy,
  color = "black",
  isSelected,
  shapeId,
  setSelectedId,
  setDraggingId
) => {
  const elements = [];
  const h = 110; // ✅ 박자-2보다 더 작음
  const strokeWidth = isSelected ? 5 : 3;

  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 * Math.PI) / 180;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);

    const x1 = cx + sin * 45; // ✅ 중심에서 더 멀리 떨어진 시작점
    const y1 = cy - cos * 45;
    const x2 = cx + sin * (h * 0.5);
    const y2 = cy - cos * (h * 0.5);

    elements.push(
      <line
        key={`compact-line-${i}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    );
  }

  return <g>{elements}</g>;
};

const renderDonutShape = (cx, cy, color = "black", isSelected) => {
  const outerRadius = 90;
  const innerRadius = 75;

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={outerRadius}
        fill={color}
        stroke={isSelected ? "black" : "none"}
        strokeWidth={2}
      />
      <circle
        cx={cx}
        cy={cy}
        r={innerRadius}
        fill="#F7F2EA"
      />
    </g>
  );
};

const renderSmallDonutShape = (cx, cy, color = "black", isSelected) => {
  const outerRadius = 55;
  const innerRadius = 42;

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={outerRadius}
        fill={color}
        stroke={isSelected ? "black" : "none"}
        strokeWidth={2}
      />
      <circle
        cx={cx}
        cy={cy}
        r={innerRadius}
        fill="#F7F2EA"
      />
    </g>
  );
};

const renderSmallFilledCircle = (cx, cy, color = "black", isSelected) => {
  const radius = 28; // 박자-5보다 작음

  return (
    <circle
      cx={cx}
      cy={cy}
      r={radius}
      fill={color}
      stroke={isSelected ? "black" : "none"}
      strokeWidth={2}
    />
  );
};

const renderFatStarShape = (cx, cy, color = "black", isSelected) => {
  const elements = [];
  const w = 8; // 선 끝 원 반지름
  const h = 190;
  const strokeWidth = isSelected ? 22 : 20; // 선 자체가 굵음

  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 * Math.PI) / 180;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);

    const x1 = cx;
    const y1 = cy;
    const x2 = cx + sin * (h * 0.5);
    const y2 = cy - cos * (h * 0.5);

    elements.push(
      <line
        key={`fat-line-${i}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    );

    elements.push(<circle key={`fat-circle-a-${i}`} cx={x2} cy={y2} r={w} fill={color} />);
    elements.push(<circle key={`fat-circle-b-${i}`} cx={cx - sin * (h * 0.5)} cy={cy + cos * (h * 0.5)} r={w} fill={color} />);
  }

  return <g>{elements}</g>;
};

const renderHollowFatStarShape = (cx, cy, color = "black", isSelected) => {
  const elements = [];
  const h = 30; // 🔸 박자-7보다 짧음
  const strokeWidth = isSelected ? 22 : 20;
  const radius = 8; // 선 끝 원 크기

  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 * Math.PI) / 180;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);

    const innerDist = 30; // 🔸 중심으로부터 떨어진 선 시작점
    const outerDist = innerDist + h;

    const x1 = cx + sin * innerDist;
    const y1 = cy - cos * innerDist;
    const x2 = cx + sin * outerDist;
    const y2 = cy - cos * outerDist;

    // 굵은 선
    elements.push(
      <line
        key={`hollow-fat-line-${i}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    );

    // 선 끝에 원
    elements.push(
      <circle key={`hollow-fat-circle-${i}`} cx={x2} cy={y2} r={radius} fill={color} />
    );
  }

  return <g>{elements}</g>;
};

const renderMiniFatStarShape = (cx, cy, color = "black", isSelected) => {
  const elements = [];
  const h = 15;  // 🔸 선 길이: 박자-8보다 짧음
  const innerDist = 20; // 🔸 중심으로부터 떨어진 거리: 더 가까움
  const strokeWidth = isSelected ? 22 : 20;
  const radius = 8; // 🔸 끝 원 크기: 작게

  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 * Math.PI) / 180;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);

    const outerDist = innerDist + h;

    const x1 = cx + sin * innerDist;
    const y1 = cy - cos * innerDist;
    const x2 = cx + sin * outerDist;
    const y2 = cy - cos * outerDist;

    // 굵은 짧은 선
    elements.push(
      <line
        key={`mini-fat-line-${i}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    );

    // 끝에 작은 원
    elements.push(
      <circle key={`mini-fat-circle-${i}`} cx={x2} cy={y2} r={radius} fill={color} />
    );
  }

  return <g>{elements}</g>;
};

const renderTriangleShape = (cx, cy, color = "black", isSelected) => {
  const size = 45; // 삼각형 한 변 길이
  const height = size * Math.sqrt(3) / 2;

  const points = [
    `${cx},${cy - height / 2}`, // top
    `${cx - size / 2},${cy + height / 2}`, // bottom left
    `${cx + size / 2},${cy + height / 2}` // bottom right
  ].join(" ");

  return (
    <polygon
      points={points}
      fill={color}
      stroke={isSelected ? "black" : "none"}
      strokeWidth="2"
    />
  );
};

const renderSquareShape = (cx, cy, color = "black", isSelected) => {
  const size = 40;
  const x = cx - size / 2;
  const y = cy - size / 2;

  return (
    <rect
      x={x}
      y={y}
      width={size}
      height={size}
      fill={color}
      stroke={isSelected ? "black" : "none"}
      strokeWidth="2"
    />
  );
};

const renderCircleShape = (cx, cy, color = "black", isSelected) => {
  const radius = 20; // 지름 40 → 사각형과 시각적 일치

  return (
    <circle
      cx={cx}
      cy={cy}
      r={radius}
      fill={color}
      stroke={isSelected ? "black" : "none"}
      strokeWidth="2"
    />
  );
};

const renderSmallSquareShape = (cx, cy, color = "black", isSelected) => {
  const size = 20;
  const x = cx - size / 2;
  const y = cy - size / 2;

  return (
    <rect
      x={x}
      y={y}
      width={size}
      height={size}
      fill={color}
      stroke={isSelected ? "black" : "none"}
      strokeWidth="2"
    />
  );
};

const renderWideRectangleShape = (cx, cy, color = "black", isSelected) => {
  const width = 65;
  const height = 40;
  const x = cx - width / 2;
  const y = cy - height / 2;

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={color}
      stroke={isSelected ? "black" : "none"}
      strokeWidth="2"
    />
  );
};

const renderHalfCircleShape = (cx, cy, color = "black", isSelected) => {
  const radius = 40;
  const d = `
    M ${cx - radius}, ${cy}
    A ${radius},${radius} 0 0,1 ${cx + radius},${cy}
    L ${cx + radius}, ${cy + 1}
    L ${cx - radius}, ${cy + 1}
    Z
  `;

  return (
    <path
      d={d}
      fill={color}
      stroke={isSelected ? "black" : "none"}
      strokeWidth="2"
    />
  );
};

const renderWideIsoscelesTriangle = (cx, cy, color = "black", isSelected) => {
  const width = 40;
  const height = 25;

  const points = [
    `${cx},${cy - height / 2}`,                // top
    `${cx - width / 2},${cy + height / 2}`,    // bottom left
    `${cx + width / 2},${cy + height / 2}`     // bottom right
  ].join(" ");

  return (
    <polygon
      points={points}
      fill={color}
      stroke={isSelected ? "black" : "none"}
      strokeWidth="2"
      transform={`rotate(90, ${cx}, ${cy})`} // 👉 오른쪽 90도 회전
    />
  );
};

const renderDiamondSquareShape = (cx, cy, color = "black", isSelected) => {
  const size = 40;
  const x = cx - size / 2;
  const y = cy - size / 2;

  return (
    <rect
      x={x}
      y={y}
      width={size}
      height={size}
      fill={color}
      stroke={isSelected ? "black" : "none"}
      strokeWidth="2"
      transform={`rotate(45, ${cx}, ${cy})`} // 💎 중심 기준 45도 회전
    />
  );
};

const renderSmallCircleShape = (cx, cy, color = "black", isSelected) => {
  const radius = 12;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={radius}
      fill={color}
      stroke={isSelected ? "black" : "none"}
      strokeWidth="2"
    />
  );
};

const renderWavySvgDonutShape = (cx, cy, color = "black", isSelected) => {
  const scale = 0.7; // 사이즈 조절 (필요에 따라)
  const translateX = cx - 50; // 100 / 2
  const translateY = cy - 51; // 102 / 2

  return (
    <g
      transform={`translate(${translateX}, ${translateY}) scale(${scale})`}
    >
      <path
        d="M17.833 19.091C22.1743 2.46616 41.4315 -5.13429 55.9569 4.04414C60.4447 6.87988 65.7085 8.23744 71.0079 7.92586C88.1606 6.91739 101.34 22.8833 97.0993 39.5341C95.7891 44.6785 96.1246 50.1042 98.0585 55.048C104.318 71.0496 93.2062 88.5175 76.06 89.6299C70.7625 89.9735 65.706 91.9692 61.6018 95.3362C48.3178 106.234 28.271 101.064 21.9146 85.1007C19.9507 80.1687 16.4902 75.9764 12.0197 73.1136C-2.4499 63.8473 -3.72758 43.1841 9.49024 32.2058C13.574 28.814 16.4917 24.2274 17.833 19.091Z"
        fill={color}
        stroke={isSelected ? "black" : "none"}
        strokeWidth="2"
      />
      <circle
        cx="50"
        cy="51"
        r="18"
        fill="#F7F2EA"
      />
    </g>
  );
};

const renderFourPointStarShape = (cx, cy, color = "black", isSelected) => {
  const size = 30; // 전체 크기 조절용

  const points = [
    `${cx},${cy - size}`,           // top
    `${cx + size * 0.4},${cy - size * 0.4}`,
    `${cx + size},${cy}`,
    `${cx + size * 0.4},${cy + size * 0.4}`,
    `${cx},${cy + size}`,
    `${cx - size * 0.4},${cy + size * 0.4}`,
    `${cx - size},${cy}`,
    `${cx - size * 0.4},${cy - size * 0.4}`
  ].join(" ");

  return (
    <polygon
      points={points}
      fill={color}
      stroke={isSelected ? "black" : "none"}
      strokeWidth="2"
    />
  );
};

const renderAsteriskShape = (cx, cy, color = "black", isSelected) => {
  const h = 20; // 선 길이
  const strokeWidth = isSelected ? 20 : 18;
  const radius = 8; // 끝 원 크기
  const lineCount = 5;
  const elements = [];

  for (let i = 0; i < lineCount; i++) {
    const angle = (i * 360 / lineCount) * (Math.PI / 180);
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);

    const x1 = cx;
    const y1 = cy;
    const x2 = cx + sin * h;
    const y2 = cy - cos * h;

    elements.push(
      <line
        key={`line-${i}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    );

    elements.push(
      <circle
        key={`cap-${i}`}
        cx={x2}
        cy={y2}
        r={radius}
        fill={color}
      />
    );
  }

  return <g>{elements}</g>;
};

const renderPointyDonutShape = (cx, cy, color = "black", isSelected) => {
  const scale = 0.7; // SVG 원본이 크므로 크기 조절
  const translateX = cx - 52.5; // 105 / 2
  const translateY = cy - 54;   // 108 / 2

  return (
    <g transform={`translate(${translateX}, ${translateY}) scale(${scale})`}>
      <path
        d="M31.7149 4.588C33.2855 1.18983 37.249 -0.374528 40.7171 1.03499L65.852 11.2505C66.4314 11.486 67.0397 11.6429 67.6607 11.717L94.601 14.9319C98.3182 15.3755 101.031 18.6617 100.762 22.3956L98.8136 49.457C98.7687 50.0808 98.8074 50.7078 98.9288 51.3213L104.196 77.9366C104.923 81.6089 102.636 85.2043 99.0018 86.1024L72.6627 92.6118C72.0555 92.7619 71.4712 92.9925 70.9253 93.2975L47.2403 106.532C43.9723 108.358 39.8462 107.294 37.869 104.115L23.539 81.0764C23.2087 80.5453 22.8088 80.0609 22.3499 79.6359L2.44438 61.1998C-0.30214 58.656 -0.565117 54.403 1.8471 51.5403L19.3298 30.7923C19.7327 30.3141 20.0699 29.7841 20.3323 29.2164L31.7149 4.588Z"
        fill={color}
        stroke={isSelected ? "black" : "none"}
        strokeWidth="2"
      />
      <circle cx="52.5" cy="54" r="16" fill="#F7F2EA" />
    </g>
  );
};

const renderEightPointStarShape = (cx, cy, color = "black", isSelected) => {
  const outerRadius = 40;
  const innerRadius = 20;
  const points = [];

  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI) / 8; // 22.5도 간격 (360 / 16)
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    points.push(`${x},${y}`);
  }

  return (
    <polygon
      points={points.join(" ")}
      fill={color}
      stroke={isSelected ? "black" : "none"}
      strokeWidth="2"
    />
  );
};

const renderSixArmAsteriskShape = (cx, cy, color = "black", isSelected) => {
  const h = 20; // 선 길이
  const strokeWidth = isSelected ? 20 : 18;
  const radius = 8; // 선 끝 원 크기
  const lineCount = 6;

  const elements = [];

  for (let i = 0; i < lineCount; i++) {
    const angle = (i * 360 / lineCount) * (Math.PI / 180);
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);

    const x1 = cx;
    const y1 = cy;
    const x2 = cx + sin * h;
    const y2 = cy - cos * h;

    elements.push(
      <line
        key={`line-${i}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    );

    elements.push(
      <circle
        key={`cap-${i}`}
        cx={x2}
        cy={y2}
        r={radius}
        fill={color}
      />
    );
  }

  return <g>{elements}</g>;
};

const renderGearDonutShape = (cx, cy, color = "black", isSelected) => {
  const baseRadius = 20;       // 중심으로부터 돌기 배치 위치
  const rippleRadius = 10;     // 돌기 크기
  const rippleCount = 12;      // 꼭짓점 개수
  const holeRadius = 15;       // 가운데 비어있는 원 크기

  const elements = [];

  // 외곽 돌기
  for (let i = 0; i < rippleCount; i++) {
    const angle = (i * 360 / rippleCount) * (Math.PI / 180);
    const x = cx + Math.cos(angle) * baseRadius;
    const y = cy + Math.sin(angle) * baseRadius;

    elements.push(
      <circle
        key={`ripple-${i}`}
        cx={x}
        cy={y}
        r={rippleRadius}
        fill={color}
      />
    );
  }

  // 중앙 구멍
  elements.push(
    <circle
      key="hole"
      cx={cx}
      cy={cy}
      r={holeRadius}
      fill="#F7F2EA"
    />
  );

  // 선택 표시 테두리
  if (isSelected) {
    elements.push(
      <circle
        key="outline"
        cx={cx}
        cy={cy}
        r={baseRadius + rippleRadius - 2}
        fill="none"
        stroke="black"
        strokeWidth="2"
      />
    );
  }

  return <g>{elements}</g>;
};

const renderBroadEightPointStar = (cx, cy, color = "black", isSelected) => {
  const outerRadius = 42; // 더 넓게
  const innerRadius = 30; // 깊이 차이 줄임 → 면적 넓어짐
  const points = [];

  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI) / 8;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    points.push(`${x},${y}`);
  }

  return (
    <polygon
      points={points.join(" ")}
      fill={color}
      stroke={isSelected ? "black" : "none"}
      strokeWidth="2"
    />
  );
};

const renderBarAsteriskShape = (cx, cy, color = "black", isSelected) => {
  const barLength = 40;
  const barWidth = 18;
  const armCount = 8; // ✅ 8방향으로 수정
  const elements = [];

  for (let i = 0; i < armCount; i++) {
    const angle = (i * 360 / armCount);

    const x = cx - barWidth / 2;
    const y = cy - barLength;
    
    elements.push(
      <rect
        key={`bar-${i}`}
        x={x}
        y={y}
        width={barWidth}
        height={barLength}
        fill={color}
        transform={`rotate(${angle}, ${cx}, ${cy})`}
      />
    );
  }

  // 선택 표시용 외곽
  if (isSelected) {
    elements.push(
      <circle
        key="outline"
        cx={cx}
        cy={cy}
        r={barLength}
        fill="none"
        stroke="black"
        strokeWidth="2"
      />
    );
  }

  return <g>{elements}</g>;
};

const renderWavyLineShape = (y, svgWidth, color, isSelected, shape, setDraggingId, setSelectedId) => {
  const amplitude = 10; // 파형 높이
  const frequency = 0.04; // 파형 밀도
  const step = 5; // 선 해상도

  let d = `M 0 ${y}`;
  for (let x = step; x <= svgWidth; x += step) {
    const waveY = y + Math.sin(x * frequency) * amplitude;
    d += ` L ${x} ${waveY}`;
  }

  return (
    <path
      key={shape.id}
      d={d}
      stroke={color}
      strokeWidth={isSelected ? 8 : 6}
      fill="none"
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    />
  );
};

const renderCurvedEmotionLine = (y, svgWidth, color, isSelected, shape, setDraggingId, setSelectedId) => {
  // 원본 path는 viewBox 높이가 61이므로, y값을 기준으로 수직 위치 보정
  const translateY = y - 145.5; // 61 / 2

  return (
    <g
      key={shape.id}
      transform={`translate(0, ${translateY}) scale(${svgWidth / 497}, 2.5)`} // 497 → 원본 너비
    >
      <path
        d="M2 57.6559C2 57.6559 302 60.1941 316 57.6559C330 55.1177 359.27 52.9558 360.5 33.1559C361.678 14.1917 341.953 0.808148 323 2.15587C305.504 3.39998 290.266 15.6175 290.5 33.1559C290.783 54.3739 324.5 57.6559 339 57.6559C353.5 57.6559 495.5 57.6559 495.5 57.6559"
        stroke={color}
        strokeWidth={isSelected ? 4 : 2.5}
        fill="none"
        onMouseDown={(e) => {
          e.stopPropagation();
          setDraggingId(shape.id);
        }}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedId(shape.id);
        }}
      />
    </g>
  );
};

const renderSharpBeatLine = (y, svgWidth, color, isSelected, shape, setDraggingId, setSelectedId) => {
  const originalWidth = 498;
  const lineYinSvg = 108; // SVG 안에서 기준선 위치
  const scale = svgWidth / originalWidth;
  const translateY = y - lineYinSvg;

  return (
    <g
      key={shape.id}
      transform={`translate(0, ${translateY}) scale(${scale})`}
    >
      <path
        d="M2 38.5H22.8423C23.2415 38.5 23.6024 38.2626 23.7605 37.8961L32.5818 17.4468C33.012 16.4495 34.5 16.7567 34.5 17.8429V37.5C34.5 38.0523 34.9477 38.5 35.5 38.5H68.5H121.71C121.899 38.5 122.085 38.4461 122.245 38.3445L141.729 25.9891C142.166 25.7121 142.741 25.8139 143.057 26.2239L151.438 37.1198C151.909 37.7316 152.866 37.6022 153.157 36.8874L167.074 2.72768C167.488 1.7113 169 2.00749 169 3.10498V53.9332C169 54.9009 170.237 55.3043 170.808 54.5227L182.2 38.9105C182.389 38.6525 182.689 38.5 183.008 38.5H211.761C211.918 38.5 212.073 38.4629 212.213 38.3918L245.048 21.7367C245.713 21.3993 246.5 21.8826 246.5 22.6285V50.5858C246.5 51.4767 247.577 51.9229 248.207 51.2929L260.707 38.7929C260.895 38.6054 261.149 38.5 261.414 38.5H278.5C279.052 38.5 279.5 38.0523 279.5 37.5V15.6545C279.5 14.484 281.166 14.2664 281.466 15.3976L289.522 45.7021C289.727 46.4724 290.706 46.7053 291.236 46.1096L297.702 38.8356C297.891 38.6221 298.163 38.5 298.449 38.5H385.382C385.761 38.5 386.107 38.286 386.276 37.9472L392.181 26.1386C392.608 25.2837 393.877 25.4583 394.057 26.397L398.11 47.4732C398.268 48.2937 399.303 48.5703 399.849 47.9379L407.701 38.8464C407.891 38.6264 408.167 38.5 408.458 38.5H496.5"
        stroke={color}
        strokeWidth={isSelected ? 4 : 2}
        strokeLinecap="round"
        fill="none"
        onMouseDown={(e) => {
          e.stopPropagation();
          setDraggingId(shape.id);
        }}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedId(shape.id);
        }}
      />
    </g>
  );
};

const renderAccentBar = (y, svgWidth, isSelected, shape, setDraggingId, setSelectedId) => {
  const barHeight = isSelected ? 12 : 10;
  const offset = 200; // 👈 여기 값 조정
  const color = "#222";

  return (
    <rect
      key={shape.id}
      x={0}
      y={y - barHeight / 2 + offset}
      width={svgWidth}
      height={barHeight}
      fill={color}
      stroke={isSelected ? "black" : "none"}
      strokeWidth={2}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    />
  );
};

const renderDecreasingVolumeAccent = (y, svgWidth, isSelected, shape, setDraggingId, setSelectedId) => {
  const height = 30;
  const offset = 200; // 원하는 만큼 내려주기
  const adjustedY = y + offset;

  const topY = adjustedY - height / 2;
  const bottomY = adjustedY + height / 2;

  const points = [
    `0,${topY}`,
    `${svgWidth},${topY + 15}`,
    `${svgWidth},${bottomY - 15}`,
    `0,${bottomY}`
  ].join(" ");

  return (
    <polygon
      key={shape.id}
      points={points}
      fill="#333"
      stroke={isSelected ? "black" : "none"}
      strokeWidth="2"
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    />
  );
};

const renderSwellingAccentBar = (y, svgWidth, isSelected, shape, setDraggingId, setSelectedId) => {
  const height = 40;
  const offset = 200;
  const adjustedY = y + offset;

  const topY = adjustedY - height / 2;
  const bottomY = adjustedY + height / 2;

  const controlOffset = svgWidth / 4; // 곡선 중앙을 향해 당기는 값

  const pathData = `
    M 0 ${topY}
    C ${controlOffset} ${topY + 20}, ${svgWidth - controlOffset} ${topY + 20}, ${svgWidth} ${topY}
    L ${svgWidth} ${bottomY}
    C ${svgWidth - controlOffset} ${bottomY - 20}, ${controlOffset} ${bottomY - 20}, 0 ${bottomY}
    Z
  `;

  return (
    <path
      key={shape.id}
      d={pathData}
      fill="#222"
      stroke={isSelected ? "black" : "none"}
      strokeWidth="2"
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    />
  );
};

const renderGrowingAccentBar = (y, svgWidth, isSelected, shape, setDraggingId, setSelectedId) => {
  const baseHeight = 1;    // 시작 두께
  const maxHeight = 40;     // 끝에서의 최대 두께
  const offset = 200;
  const adjustedY = y + offset;

  const topStart = adjustedY - baseHeight / 2;
  const bottomStart = adjustedY + baseHeight / 2;

  const topEnd = adjustedY - maxHeight / 2;
  const bottomEnd = adjustedY + maxHeight / 2;

  const controlX = svgWidth * 0.7;

  const pathData = `
    M 0 ${topStart}
    Q ${controlX} ${topStart}, ${svgWidth} ${topEnd}
    L ${svgWidth} ${bottomEnd}
    Q ${controlX} ${bottomStart}, 0 ${bottomStart}
    Z
  `;

  return (
    <path
      key={shape.id}
      d={pathData}
      fill="#222"
      stroke={isSelected ? "black" : "none"}
      strokeWidth="2"
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    />
  );
};

const renderShrinkingAccentBar = (y, svgWidth, isSelected, shape, setDraggingId, setSelectedId) => {
  const baseHeight = 40;   // 시작 두께 (왼쪽)
  const minHeight = 1;    // 끝 두께 (오른쪽)
  const offset = 200;
  const adjustedY = y + offset;

  const topStart = adjustedY - baseHeight / 2;
  const bottomStart = adjustedY + baseHeight / 2;

  const topEnd = adjustedY - minHeight / 2;
  const bottomEnd = adjustedY + minHeight / 2;

  const controlX = svgWidth * 0.3;

  const pathData = `
    M 0 ${topStart}
    Q ${controlX} ${topStart}, ${svgWidth} ${topEnd}
    L ${svgWidth} ${bottomEnd}
    Q ${controlX} ${bottomStart}, 0 ${bottomStart}
    Z
  `;

  return (
    <path
      key={shape.id}
      d={pathData}
      fill="#222"
      stroke={isSelected ? "black" : "none"}
      strokeWidth="2"
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    />
  );
};



const SoundPatternBuilder = () => {
  const [shapes, setShapes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedShape, setSelectedShape] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playheadX, setPlayheadX] = useState(0);
  const [showPitchLines, setShowPitchLines] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
const [composerName, setComposerName] = useState("");


  const svgRef = useRef(null);
  const shapesRef = useRef(shapes);
  const startTimeRef = useRef(null);
  const pauseTimeRef = useRef(null);
  const animationRef = useRef(null);
  const activeAudios = useRef([]);

// 🔼 컴포넌트 상단에 함수 정의 추가
const handleSaveToGallery = () => {
  if (!svgRef.current) return;

  toPng(svgRef.current, {
    backgroundColor: "#F7F2EA",
    cacheBust: true,
    embedWebFonts: false, // 🔧 웹폰트 오류 방지
  })
    .then((dataUrl) => {
      // 이제는 단순히 다운로드만 수행
      download(dataUrl, "my-score.png");
    })
    .catch((err) => {
      console.error("이미지 다운로드 실패:", err);
    });
};


  useEffect(() => {
    shapesRef.current = shapes;
  }, [shapes]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        setShapes(prev => prev.filter(shape => shape.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId]);

  const playSoundForShape = (shape, pitch, elapsed) => {
    if (!shape || !shape.type) return;
    if (elapsed - shape.lastPlayed < 300) return;
    shape.lastPlayed = elapsed;

    const color = shape.customColor;
    let audio = null;

    if (shape.type.startsWith("배경음")) {
      const files = durationSounds[color];
      if (!files) return;
      audio = new Audio(files[Math.floor(Math.random() * files.length)]);
      audio.volume = 0.5;
    } else if (shape.type.startsWith("음계")) {
      const group = shape.group;
      if (!group || !pitch) return;
      const validGroups = pitchGroups[color];
      if (!validGroups?.includes(group)) return;

      const folder = color === "#4284F3" ? "blue"
        : color === "#6EC1A1" ? "green"
        : color === "#F5BC62" ? "yellow"
        : color === "#FE6E3D" ? "orange"
        : "pink";

      const pitchMap = {
        "C": "C", "D": "D", "E": "E", "F": "F", "G": "G", "A": "A", "B": "B", "C'": "Cprime"
      };
      const safePitch = pitchMap[pitch];
      const path = `/sound/pitch/${folder}/${group}/${group}_${safePitch}.mp3`;
      audio = new Audio(path);
      audio.volume = 0.7;
    } else if (shape.type.startsWith("박자")) {
      const files = rhythmSounds[color];
      if (!files) return;
      audio = new Audio(files[Math.floor(Math.random() * files.length)]);
      audio.volume = 0.4;
    }

    if (audio) {
      audio.play().catch(() => {});
      activeAudios.current.push(audio);
    }
  };

  const step = (timestamp) => {
    if (!isPlaying || isPaused) return;
    const svgWidth = svgRef.current?.clientWidth || 800;
    const svgHeight = svgRef.current?.clientHeight || 800;

    if (!startTimeRef.current) startTimeRef.current = timestamp - (pauseTimeRef.current || 0);
    const elapsed = timestamp - startTimeRef.current;
    const newX = (elapsed / PLAYBACK_DURATION) * svgWidth;

    if (newX > svgWidth) {
      setIsPlaying(false);
      setPlayheadX(0);
      startTimeRef.current = null;
      pauseTimeRef.current = null;
      cancelAnimationFrame(animationRef.current);
      return;
    }

    setPlayheadX(newX);

    shapesRef.current.forEach((shape) => {
      const shapeX = (shape.xPercent / 100) * svgWidth;
      const shapeY = (shape.yPercent / 100) * svgHeight;

      if (shape.type.startsWith("배경음")) {
        if (shape.lastPlayed === 0) {
          playSoundForShape(shape, null, elapsed);
        }
      } else {
        if (Math.abs(shapeX - newX) < 10) {
          const pitch = shape.type.startsWith("음계") ? getPitchFromY(shapeY, svgHeight) : null;
          playSoundForShape(shape, pitch, elapsed);
        }
      }
    });

    animationRef.current = requestAnimationFrame(step);
  };

  const startPlayback = () => {
    shapesRef.current.forEach((s) => (s.lastPlayed = 0));
    setIsPlaying(true);
    setIsPaused(false);
    setPlayheadX(0);
    startTimeRef.current = null;
    pauseTimeRef.current = null;
    activeAudios.current = [];
    cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(step);
  };

  const pausePlayback = () => {
    if (isPlaying && !isPaused) {
      setIsPaused(true);
      pauseTimeRef.current = performance.now() - startTimeRef.current;
      cancelAnimationFrame(animationRef.current);
      activeAudios.current.forEach((a) => a.pause());
      activeAudios.current = [];
    }
  };

  const resumePlayback = () => {
    if (isPlaying && isPaused) {
      setIsPaused(false);
      animationRef.current = requestAnimationFrame(step);
    }
  };

  const addShape = () => {
    if (!selectedShape || !selectedCategory) return;
    const newShape = initialShape(20, 50, selectedShape);
    if (selectedCategory === "음계") {
      const groups = pitchGroups[selectedColor];
      if (groups?.length > 0) newShape.group = groups[Math.floor(Math.random() * groups.length)];
    }
    newShape.customColor = selectedColor;
    setShapes([...shapesRef.current, newShape]);
  };

  const handleMouseMove = (e) => {
  const svgRect = svgRef.current.getBoundingClientRect();
  const svgWidth = svgRect.width;
  const svgHeight = svgRect.height;

  if (draggingId) {
    const newShapes = shapesRef.current.map((shape) => {
      if (shape.id === draggingId) {
        const offsetY = shape.type.startsWith("강세") ? 200 : 0;
        const rawY = ((e.clientY - svgRect.top - offsetY) / svgHeight) * svgHeight;
        const snappedY = shape.type.startsWith("음계") ? getClosestLeadY(rawY, svgHeight) : rawY;

        return {
          ...shape,
          xPercent: ((e.clientX - svgRect.left) / svgWidth) * 100,
          yPercent: (snappedY / svgHeight) * 100,
        };
      }
      return shape;
    });
    setShapes(newShapes);
  }
};

const handleDownload = () => {
  if (!svgRef.current) return;

  toPng(svgRef.current, {
    backgroundColor: "#F7F2EA",  // SVG 배경 흰색
    cacheBust: true,
    embedWebFonts: false
  })
    .then((dataUrl) => {
      download(dataUrl, "my-score.png");

      // 👉 이미지 다운로드 후 로컬 저장용 데이터 생성
      const item = {
        id: uuidv4(),
        image: dataUrl,
        composer: composerName || "익명",
        likes: 0,
        comments: [],
        shapeData: shapesRef.current,
        createdAt: Date.now(),
      };

      // 👉 저장 기능 임시 비활성화 (QuotaExceededError 방지)
      try {
        const prev = JSON.parse(localStorage.getItem("galleryItems") || "[]");
        // localStorage.setItem("galleryItems", JSON.stringify([item, ...prev]));
        console.warn("🛑 localStorage 저장은 현재 비활성화됨 (용량 초과 방지)");
      } catch (e) {
        console.error("갤러리 저장 실패:", e);
      }
    })
    .catch((err) => {
      console.error("이미지 다운로드 또는 저장 실패:", err);
    });
};





  return (
    <section className="builder-section">
      <div className="builder-canvas">
        <svg
          ref={svgRef}
          className="builder-svg"
          onMouseMove={handleMouseMove}
          onMouseUp={() => setDraggingId(null)}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedId(null);
          }}
        >
          {showPitchLines &&
            Array.from({ length: NUM_PITCH_LINES }).map((_, i) => {
              const svgHeight = svgRef.current?.clientHeight || 800;
              const svgWidth = svgRef.current?.clientWidth || 800;
              const centerY = svgHeight / 2;
              const y = centerY + (i - 3.5) * LINE_SPACING;
              return <line key={i} x1={0} y1={y} x2={svgWidth} y2={y} stroke="red" strokeWidth="1" />;
            })}

          {shapes.map((shape) => {
            const svgWidth = svgRef.current?.clientWidth || 800;
            const svgHeight = svgRef.current?.clientHeight || 800;
            const x = (shape.xPercent / 100) * svgWidth;
            const y = (shape.yPercent / 100) * svgHeight;
            const isSelected = selectedId === shape.id;

            if (shape.type === "배경음-1") {
  const svgWidth = svgRef.current?.clientWidth || 800;
  const svgHeight = svgRef.current?.clientHeight || 800;
  const y = (shape.yPercent / 100) * svgHeight;
  const isSelected = selectedId === shape.id;

  return (
    <line
      key={shape.id}
      x1={0}
      y1={y}
      x2={svgWidth}
      y2={y}
      stroke={shape.customColor || "skyblue"}
      strokeWidth={isSelected ? 8 : 6}
      strokeDasharray="12 8" // 점선 처리
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    />
  );
}

if (shape.type === "배경음-3") {
  const svgWidth = svgRef.current?.clientWidth || 800;
  const svgHeight = svgRef.current?.clientHeight || 800;
  const y = (shape.yPercent / 100) * svgHeight;
  const isSelected = selectedId === shape.id;

  return renderWavyLineShape(
    y,
    svgWidth,
    shape.customColor || "skyblue",
    isSelected,
    shape,
    setDraggingId,
    setSelectedId
  );
}

if (shape.type === "배경음-4") {
  const svgWidth = svgRef.current?.clientWidth || 800;
  const svgHeight = svgRef.current?.clientHeight || 800;
  const y = (shape.yPercent / 100) * svgHeight;
  const isSelected = selectedId === shape.id;

  return renderCurvedEmotionLine(
    y,
    svgWidth,
    shape.customColor || "skyblue",
    isSelected,
    shape,
    setDraggingId,
    setSelectedId
  );
}

if (shape.type === "배경음-5") {
  const svgWidth = svgRef.current?.clientWidth || 800;
  const svgHeight = svgRef.current?.clientHeight || 800;
  const y = (shape.yPercent / 100) * svgHeight;
  const isSelected = selectedId === shape.id;

  return renderSharpBeatLine(
    y,
    svgWidth,
    shape.customColor || "skyblue",
    isSelected,
    shape,
    setDraggingId,
    setSelectedId
  );
}



            if (shape.type.startsWith("배경음")) {
              return (
                <line
                  key={shape.id}
                  x1={0}
                  y1={y}
                  x2={svgWidth}
                  y2={y}
                  stroke={shape.customColor || "skyblue"}
                  strokeWidth={isSelected ? 8 : 6}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggingId(shape.id);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(shape.id);
                  }}
                />
              );
            }

            if (shape.type === "강세-1") {
  const svgWidth = svgRef.current?.clientWidth || 800;
  const svgHeight = svgRef.current?.clientHeight || 800;
  const y = (shape.yPercent / 100) * svgHeight;
  const isSelected = selectedId === shape.id;

  return renderAccentBar(
    y,
    svgWidth,
    isSelected,
    shape,
    setDraggingId,
    setSelectedId
  );
}

if (shape.type === "강세-2") {
  const svgWidth = svgRef.current?.clientWidth || 800;
  const svgHeight = svgRef.current?.clientHeight || 800;
  const y = (shape.yPercent / 100) * svgHeight;
  const isSelected = selectedId === shape.id;

  return renderDecreasingVolumeAccent(
    y,
    svgWidth,
    isSelected,
    shape,
    setDraggingId,
    setSelectedId
  );
}

if (shape.type === "강세-3") {
  const svgWidth = svgRef.current?.clientWidth || 800;
  const svgHeight = svgRef.current?.clientHeight || 800;
  const y = (shape.yPercent / 100) * svgHeight;
  const isSelected = selectedId === shape.id;

  return renderSwellingAccentBar(
    y,
    svgWidth,
    isSelected,
    shape,
    setDraggingId,
    setSelectedId
  );
}

if (shape.type === "강세-4") {
  const svgWidth = svgRef.current?.clientWidth || 800;
  const svgHeight = svgRef.current?.clientHeight || 800;
  const y = (shape.yPercent / 100) * svgHeight;
  const isSelected = selectedId === shape.id;

  return renderGrowingAccentBar(
    y,
    svgWidth,
    isSelected,
    shape,
    setDraggingId,
    setSelectedId
  );
}

if (shape.type === "강세-5") {
  const svgWidth = svgRef.current?.clientWidth || 800;
  const svgHeight = svgRef.current?.clientHeight || 800;
  const y = (shape.yPercent / 100) * svgHeight;
  const isSelected = selectedId === shape.id;

  return renderShrinkingAccentBar(
    y,
    svgWidth,
    isSelected,
    shape,
    setDraggingId,
    setSelectedId
  );
}



if (shape.type === "박자-1") {
  const HITBOX_SIZE = 24;
  return (
    <g
      key={shape.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    >
      <rect
        x={x - HITBOX_SIZE / 2}
        y={y - HITBOX_SIZE / 2}
        width={HITBOX_SIZE}
        height={HITBOX_SIZE}
        fill="transparent"
        pointerEvents="all"
      />
      {renderStarShapeFromMatter(x, y, shape.customColor || "black", isSelected)}
    </g>
  );
}

if (shape.type === "박자-2") {
  const HITBOX_SIZE = 24;
  return (
    <g
      key={shape.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    >
      <rect
        x={x - HITBOX_SIZE / 2}
        y={y - HITBOX_SIZE / 2}
        width={HITBOX_SIZE}
        height={HITBOX_SIZE}
        fill="transparent"
        pointerEvents="all"
      />
      {renderHollowStarShape(x, y, shape.customColor || "black", isSelected)}
    </g>
  );
}

if (shape.type === "박자-3") {
  const HITBOX_SIZE = 24;
  return (
    <g
      key={shape.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    >
      <rect
        x={x - HITBOX_SIZE / 2}
        y={y - HITBOX_SIZE / 2}
        width={HITBOX_SIZE}
        height={HITBOX_SIZE}
        fill="transparent"
        pointerEvents="all"
      />
      {renderCompactStarShape(
        x,
        y,
        shape.customColor || "black",
        isSelected,
        shape.id,
        setSelectedId,
        setDraggingId
      )}
    </g>
  );
}


if (shape.type === "박자-4") {
  return (
    <g
      key={shape.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    >
      {renderDonutShape(x, y, shape.customColor || "black", isSelected)}
    </g>
  );
}

if (shape.type === "박자-5") {
  return (
    <g
      key={shape.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    >
      {renderSmallDonutShape(x, y, shape.customColor || "black", isSelected)}
    </g>
  );
}

if (shape.type === "박자-6") {
  return (
    <g
      key={shape.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    >
      {renderSmallFilledCircle(x, y, shape.customColor || "black", isSelected)}
    </g>
  );
}

if (shape.type === "박자-7") {
  return (
    <g
      key={shape.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    >
      {renderFatStarShape(x, y, shape.customColor || "black", isSelected)}
    </g>
  );
}

if (shape.type === "박자-8") {
  return (
    <g
      key={shape.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    >
      {renderHollowFatStarShape(x, y, shape.customColor || "black", isSelected)}
    </g>
  );
}

if (shape.type === "박자-9") {
  return (
    <g
      key={shape.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    >
      {renderMiniFatStarShape(x, y, shape.customColor || "black", isSelected)}
    </g>
  );
}

if (shape.type === "음계-1") {
  return (
    <g
      key={shape.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    >
      {renderTriangleShape(x, y, shape.customColor || "black", isSelected)}
    </g>
  );
}

if (shape.type === "음계-2") {
  return (
    <g
      key={shape.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    >
      {renderSquareShape(x, y, shape.customColor || "black", isSelected)}
    </g>
  );
}

if (shape.type === "음계-3") {
  return (
    <g
      key={shape.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    >
      {renderCircleShape(x, y, shape.customColor || "black", isSelected)}
    </g>
  );
}

if (shape.type === "음계-4") {
  return (
    <g
      key={shape.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    >
      {renderSmallSquareShape(x, y, shape.customColor || "black", isSelected)}
    </g>
  );
}

if (shape.type === "음계-5") {
  return (
    <g
      key={shape.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    >
      {renderWideRectangleShape(x, y, shape.customColor || "black", isSelected)}
    </g>
  );
}

if (shape.type === "음계-6") {
  return (
    <g
      key={shape.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    >
      {renderHalfCircleShape(x, y, shape.customColor || "black", isSelected)}
    </g>
  );
}

if (shape.type === "음계-7") {
  return (
    <g
      key={shape.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    >
      {renderWideIsoscelesTriangle(x, y, shape.customColor || "black", isSelected)}
    </g>
  );
}

if (shape.type === "음계-8") {
  return (
    <g
      key={shape.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    >
      {renderDiamondSquareShape(x, y, shape.customColor || "black", isSelected)}
    </g>
  );
}

if (shape.type === "음계-9") {
  return (
    <g
      key={shape.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    >
      {renderSmallCircleShape(x, y, shape.customColor || "black", isSelected)}
    </g>
  );
}

if (shape.type === "음계-10") {
  return (
    <g
      key={shape.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    >
      {renderWavySvgDonutShape(x, y, shape.customColor || "black", isSelected)}
    </g>
  );
}

if (shape.type === "음계-11") {
  return (
    <g
      key={shape.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    >
      {renderFourPointStarShape(x, y, shape.customColor || "black", isSelected)}
    </g>
  );
}

if (shape.type === "음계-12") {
  return (
    <g
      key={shape.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    >
      {renderAsteriskShape(x, y, shape.customColor || "black", isSelected)}
    </g>
  );
}

if (shape.type === "음계-13") {
  return (
    <g
      key={shape.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    >
      {renderPointyDonutShape(x, y, shape.customColor || "black", isSelected)}
    </g>
  );
}

if (shape.type === "음계-14") {
  return (
    <g
      key={shape.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    >
      {renderEightPointStarShape(x, y, shape.customColor || "black", isSelected)}
    </g>
  );
}

if (shape.type === "음계-15") {
  return (
    <g
      key={shape.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    >
      {renderSixArmAsteriskShape(x, y, shape.customColor || "black", isSelected)}
    </g>
  );
}

if (shape.type === "음계-16") {
  return (
    <g
      key={shape.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    >
      {renderGearDonutShape(x, y, shape.customColor || "black", isSelected)}
    </g>
  );
}

if (shape.type === "음계-17") {
  return (
    <g
      key={shape.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    >
      {renderBroadEightPointStar(x, y, shape.customColor || "black", isSelected)}
    </g>
  );
}

if (shape.type === "음계-18") {
  return (
    <g
      key={shape.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        setDraggingId(shape.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(shape.id);
      }}
    >
      {renderBarAsteriskShape(x, y, shape.customColor || "black", isSelected)}
    </g>
  );
}




            return (
              <circle
                key={shape.id}
                cx={x}
                cy={y}
                r="12"
                fill={shape.customColor || "skyblue"}
                stroke={isSelected ? "black" : "none"}
                strokeWidth="2"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDraggingId(shape.id);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(shape.id);
                }}
              />
            );
          })}

          {isPlaying && (
            <line
              x1={playheadX}
              y1={0}
              x2={playheadX}
              y2={svgRef.current?.clientHeight || 800}
              stroke="red"
              strokeWidth={2}
            />
          )}
        </svg>
      </div>

      <div className="builder-controls">
        {!selectedCategory ? (
          <div>
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => { setSelectedCategory(cat); setSelectedShape(null); }}>{cat}</button>
            ))}
          </div>
        ) : (
          <>
            <div>
              {SHAPES_BY_CATEGORY[selectedCategory].map((shape) => (
                <button key={shape} onClick={() => setSelectedShape(shape)}>{shape}</button>
              ))}
            </div>
            <button onClick={() => setSelectedCategory(null)}>← 카테고리로 돌아가기</button>
          </>
        )}

        <div style={{ marginTop: 10 }}>
          <button onClick={addShape}>Add Shape</button>
          <button onClick={startPlayback}>▶</button>
          <button onClick={pausePlayback}>⏸</button>
          <button onClick={resumePlayback}>⏵</button>
          <button onClick={() => setShowSaveModal(true)}>저장하기</button>

        </div>

{showSaveModal && (
  <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
    <div className="save-modal" onClick={(e) => e.stopPropagation()}>
      <h3>저장 방법 선택</h3>
      <input
        type="text"
        placeholder="작곡가 이름 입력"
        value={composerName}
        onChange={(e) => setComposerName(e.target.value)}
      />
      <button onClick={handleDownload}>다운로드</button>
      <button onClick={() => {
        handleSaveToGallery(composerName);
        setShowSaveModal(false);
      }}>갤러리에 저장</button>
      <button onClick={() => setShowSaveModal(false)}>취소</button>
    </div>
  </div>
)}



        

        <div style={{ marginTop: 10 }}>
          {["#FE6E3D", "#6EC1A1", "#F5BC62", "#4284F3", "#EF7A88"].map((color) => (
            <button
              key={color}
              style={{ backgroundColor: color, width: 24, height: 24, borderRadius: "50%", marginRight: 6 }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedColor(color);
                setShapes(prev =>
                  prev.map(shape => {
                    if (shape.id === selectedId) {
                      const groups = pitchGroups[color];
                      const newGroup = groups?.length > 0
                        ? groups[Math.floor(Math.random() * groups.length)]
                        : shape.group;
                      return { ...shape, customColor: color, group: newGroup };
                    }
                    return shape;
                  })
                );
              }}
              title={color}
            />
          ))}
        </div>

        <div style={{ marginTop: 10 }}>
          <button onClick={() => setShowPitchLines(!showPitchLines)}>
            리드줄 {showPitchLines ? "끄기" : "보이기"}
          </button>
        </div>
      </div>
    </section>

    
  );
};

export default SoundPatternBuilder;
