import * as THREE from "three";

/**
 * Procedurally generates the cybernetic PCB substrate texture with luminous electric-blue circuit traces:
 * - Dark-tech slate base (#0F172A) from ui-ux-pro-max
 * - HUD cyan circuit traces (#22D3EE, #67E8F9, #0891B2)
 * - White circular connection pads / vias
 * - Soft white border bevel
 */
function createPcbHexTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // 1) Dark navy floor (كحلي غامق), not pure black
  ctx.fillStyle = "#0F172A";
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle dark grid
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 1;
  const gridSize = 32;
  for (let x = 0; x <= 1024; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y <= 1024; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // 2) Electric cyan circuit traces
  ctx.shadowColor = "#22D3EE";
  ctx.shadowBlur = 12;

  const tracePaths = [
    // Top-left circuit network
    {
      pts: [
        [60, 60],
        [220, 60],
        [340, 180],
        [340, 360],
      ],
      width: 4,
      color: "#67E8F9",
    },
    {
      pts: [
        [60, 140],
        [180, 140],
        [260, 220],
        [260, 420],
      ],
      width: 3,
      color: "#22D3EE",
    },
    {
      pts: [
        [140, 60],
        [140, 180],
        [220, 260],
        [420, 260],
      ],
      width: 2.5,
      color: "#0891B2",
    },
    {
      pts: [
        [20, 280],
        [160, 280],
        [220, 340],
        [220, 500],
      ],
      width: 3,
      color: "#67E8F9",
    },

    // Top-right circuit network
    {
      pts: [
        [964, 60],
        [804, 60],
        [684, 180],
        [684, 360],
      ],
      width: 4,
      color: "#67E8F9",
    },
    {
      pts: [
        [964, 140],
        [844, 140],
        [764, 220],
        [764, 420],
      ],
      width: 3,
      color: "#22D3EE",
    },
    {
      pts: [
        [884, 60],
        [884, 180],
        [804, 260],
        [604, 260],
      ],
      width: 2.5,
      color: "#0891B2",
    },
    {
      pts: [
        [1004, 280],
        [864, 280],
        [804, 340],
        [804, 500],
      ],
      width: 3,
      color: "#67E8F9",
    },

    // Bottom-left circuit network
    {
      pts: [
        [60, 964],
        [220, 964],
        [340, 844],
        [340, 664],
      ],
      width: 4,
      color: "#67E8F9",
    },
    {
      pts: [
        [60, 884],
        [180, 884],
        [260, 804],
        [260, 604],
      ],
      width: 3,
      color: "#22D3EE",
    },
    {
      pts: [
        [140, 964],
        [140, 844],
        [220, 764],
        [420, 764],
      ],
      width: 2.5,
      color: "#0891B2",
    },
    {
      pts: [
        [20, 744],
        [160, 744],
        [220, 684],
        [220, 524],
      ],
      width: 3,
      color: "#67E8F9",
    },

    // Bottom-right circuit network
    {
      pts: [
        [964, 964],
        [804, 964],
        [684, 844],
        [684, 664],
      ],
      width: 4,
      color: "#67E8F9",
    },
    {
      pts: [
        [964, 884],
        [844, 884],
        [764, 804],
        [764, 604],
      ],
      width: 3,
      color: "#22D3EE",
    },
    {
      pts: [
        [884, 964],
        [884, 844],
        [804, 764],
        [604, 764],
      ],
      width: 2.5,
      color: "#0891B2",
    },
    {
      pts: [
        [1004, 744],
        [864, 744],
        [804, 684],
        [804, 524],
      ],
      width: 3,
      color: "#67E8F9",
    },

    // Radial diagonal feeder lines pointing toward center
    {
      pts: [
        [512, 40],
        [512, 180],
      ],
      width: 4,
      color: "#22D3EE",
    },
    {
      pts: [
        [512, 984],
        [512, 844],
      ],
      width: 4,
      color: "#22D3EE",
    },
    {
      pts: [
        [40, 512],
        [180, 512],
      ],
      width: 4,
      color: "#22D3EE",
    },
    {
      pts: [
        [984, 512],
        [844, 512],
      ],
      width: 4,
      color: "#22D3EE",
    },
  ];

  for (const trace of tracePaths) {
    ctx.beginPath();
    ctx.strokeStyle = trace.color;
    ctx.lineWidth = trace.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(trace.pts[0][0], trace.pts[0][1]);
    for (let i = 1; i < trace.pts.length; i++) {
      ctx.lineTo(trace.pts[i][0], trace.pts[i][1]);
    }
    ctx.stroke();
  }

  // 3) Circular terminal pads / vias — white (matches locked pin look)
  const nodes = [
    [60, 60, 7],
    [340, 180, 6],
    [340, 360, 8],
    [964, 60, 7],
    [684, 180, 6],
    [684, 360, 8],
    [60, 964, 7],
    [340, 844, 6],
    [340, 664, 8],
    [964, 964, 7],
    [684, 844, 6],
    [684, 664, 8],
    [512, 180, 9],
    [512, 844, 9],
    [180, 512, 9],
    [844, 512, 9],
    [260, 220, 6],
    [764, 220, 6],
    [260, 804, 6],
    [764, 804, 6],
  ];

  ctx.shadowBlur = 10;
  ctx.shadowColor = "rgba(255, 255, 255, 0.55)";

  for (let i = 0; i < nodes.length; i++) {
    const [nx, ny, r] = nodes[i];
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(nx, ny, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(nx, ny, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4) Edge frame — soft white rings
  ctx.shadowBlur = 6;
  ctx.shadowColor = "rgba(255, 255, 255, 0.35)";
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, 1000, 1000);

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, 984, 984);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 16;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Draws the high-fidelity ASAS SOFT logo matching the exact branding typography:
 * - Line 1 "ASAS":
 *     Glyph 1: Inverted V chevron "A" (wide open stance, no horizontal crossbar, horizontal baseline cut)
 *     Glyph 2: Clean geometric uppercase "S" (matching size and height of A)
 *     Glyph 3: Stylized second "A" with floating diagonal slash and full right leg (, \) matching Glyph 1 in size
 *     Glyph 4: Clean geometric uppercase "S"
 * - Line 2 "S O F T":
 *     Centered, tracked geometric uppercase sans-serif with enlarged font size (108px)
 */
function drawAsasSoftLogo(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;

  // Typography dimensions for Line 1 ("ASAS")
  const H = 260;
  const halfW = 142; // Wide, open modern chevron stance (full base width = 284px)
  const sw = 34; // Bold, crisp stroke matching typography
  const yTop = cy - 70 - H / 2; // 824
  const yBase = yTop + H; // 1084

  // Balanced horizontal spacing (step = 358px between centers)
  const step = 358;
  const x1 = cx - 1.5 * step; // 487 (First A chevron)
  const x2 = cx - 0.5 * step; // 845 (First S)
  const x3 = cx + 0.5 * step; // 1203 (Second stylized A, matching in size)
  const x4 = cx + 1.5 * step; // 1561 (Second S)

  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = sw;
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  ctx.miterLimit = 8;

  // Luminous white bloom for 3D realism
  ctx.shadowColor = "rgba(255, 255, 255, 0.4)";
  ctx.shadowBlur = 14;

  // --- GLYPH 1: Inverted V Chevron "A" (/\) - Open stance ---
  ctx.save();
  ctx.beginPath();
  ctx.rect(x1 - halfW - 60, yTop - 40, halfW * 2 + 120, H + 40);
  ctx.clip();

  ctx.beginPath();
  ctx.moveTo(x1 - halfW - 25, yBase + 35);
  ctx.lineTo(x1, yTop);
  ctx.lineTo(x1 + halfW + 25, yBase + 35);
  ctx.stroke();
  ctx.restore();

  // --- GLYPH 3: Stylized Broken "A" (, \) - Exactly matching Glyph 1 in size ---
  ctx.save();
  ctx.beginPath();
  ctx.rect(x3 - 2, yTop - 40, halfW + 60, H + 40);
  ctx.clip();

  ctx.beginPath();
  ctx.moveTo(x3 - 25, yTop + 45);
  ctx.lineTo(x3, yTop);
  ctx.lineTo(x3 + halfW + 25, yBase + 35);
  ctx.stroke();
  ctx.restore();

  // Left floating diagonal slash matching Glyph 1 in size
  ctx.save();
  const slashTopY = yTop + 0.38 * H;
  const slashBottomY = yBase;
  ctx.beginPath();
  ctx.rect(x3 - halfW - 50, slashTopY, halfW + 50, slashBottomY - slashTopY);
  ctx.clip();

  ctx.beginPath();
  ctx.moveTo(x3 - halfW - 25, yBase + 35);
  ctx.lineTo(x3, yTop);
  ctx.stroke();
  ctx.restore();

  // --- GLYPHS 2 & 4: Modern Geometric "S" matching exact height & size of "A" ---
  const targetH = H;
  let sFontSize = Math.round(H / 0.705); // ~369px baseline guess for cap-height

  ctx.font = `600 ${sFontSize}px "Montserrat", "Outfit", "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const sTest = ctx.measureText("S");
  let sAscent = sTest.actualBoundingBoxAscent;
  let sDescent = sTest.actualBoundingBoxDescent;

  if (sAscent && sAscent > 0) {
    const measuredH = sAscent + (sDescent || 0);
    if (measuredH > 0 && Math.abs(measuredH - targetH) > 2) {
      sFontSize = Math.round(sFontSize * (targetH / measuredH));
      ctx.font = `600 ${sFontSize}px "Montserrat", "Outfit", "Segoe UI", system-ui, sans-serif`;
      const sRefined = ctx.measureText("S");
      sAscent = sRefined.actualBoundingBoxAscent || sAscent;
      sDescent = sRefined.actualBoundingBoxDescent || sDescent;
    }
  }

  const sBaselineY = sAscent ? yTop + sAscent : yBase - 4;

  // Render both S letters with matched height and expansive geometric width (1.12x)
  ctx.save();
  ctx.translate(x2, sBaselineY);
  ctx.scale(1.12, 1.0);
  ctx.fillText("S", 0, 0);
  ctx.restore();

  ctx.save();
  ctx.translate(x4, sBaselineY);
  ctx.scale(1.12, 1.0);
  ctx.fillText("S", 0, 0);
  ctx.restore();

  // --- LINE 2: "S  O  F  T" ---
  // Centered below ASAS with generous tracking/letter spacing, slightly enlarged
  const softY = yBase + 135;
  ctx.font =
    '600 108px "Montserrat", "Outfit", "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const softLetters = ["S", "O", "F", "T"];
  const softSpan = 580;
  const softStartX = cx - softSpan / 2;
  const softStep = softSpan / (softLetters.length - 1);

  softLetters.forEach((letter, i) => {
    ctx.fillText(letter, softStartX + i * softStep, softY);
  });

  ctx.restore();
}

/**
 * Generates procedural texture for the "ASAS SOFT" inscription
 */
function createAsasSoftTextTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  drawAsasSoftLogo(ctx, 2048, 2048);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  if (typeof document !== "undefined" && document.fonts?.ready) {
    document.fonts.ready
      .then(() => {
        drawAsasSoftLogo(ctx, 2048, 2048);
        texture.needsUpdate = true;
      })
      .catch(() => {});
  }

  return texture;
}

/** Default look — locked custom: white front pins, gold back pads, white PCB vias. */
export const DEFAULT_CHIP_PALETTE = {
  id: "custom",
  label: "Custom",
  package: "#000000",
  pins: "#ffffff",
  pinsEmissive: "#fcfcfc",
  pinsBack: "#D4AF37",
  pinsBackEmissive: "#D4AF37",
  pcb: "#ffffff",
  pcbEmissive: "#0e4488",
  text: "#e8f4ff",
  textEmissive: "#60a5fa",
  ambient: "#9baac5",
  key: "#e8f1fa",
  fill: "#4b5c72",
  rim: "#ffffff",
  floor: "#3b82f6",
  hemiSky: "#93c5fd",
  hemiGround: "#050a16",
};

/**
 * Creates materials for the 3D chip
 * @param {Partial<typeof DEFAULT_CHIP_PALETTE>} [palette]
 */
export function createChipMaterials(palette = {}) {
  const p = { ...DEFAULT_CHIP_PALETTE, ...palette };
  const pcbTexture =
    typeof document !== "undefined" ? createPcbHexTexture() : null;

  const topPackage = new THREE.MeshStandardMaterial({
    color: new THREE.Color(p.package),
    roughness: 0.4,
    metalness: 0.2,
  });

  const topText = new THREE.MeshStandardMaterial({
    color: new THREE.Color(p.text),
    emissive: new THREE.Color(p.textEmissive),
    emissiveIntensity: 0.28,
    roughness: 0.22,
    metalness: 0.42,
  });

  // Visible / edge pins
  const pins = new THREE.MeshStandardMaterial({
    color: new THREE.Color(p.pins),
    roughness: 0.18,
    metalness: 0.9,
    emissive: new THREE.Color(p.pinsEmissive),
    emissiveIntensity: 0.22,
  });

  // Background pins: view-stable gold (unlit, no tone map) so orbit/tilt keep #D4AF37
  const bottomPins = new THREE.MeshBasicMaterial({
    color: new THREE.Color(p.pinsBack),
    toneMapped: false,
  });

  const pcbBoard = new THREE.MeshStandardMaterial({
    color: new THREE.Color(p.pcb),
    roughness: 0.5,
    metalness: 0.28,
    map: pcbTexture,
    emissive: new THREE.Color(p.pcbEmissive),
    emissiveIntensity: 0.2,
  });

  const alignmentLines = new THREE.LineBasicMaterial({
    color: new THREE.Color(p.pins),
    transparent: true,
    opacity: 0.65,
  });

  return {
    topPackage,
    topText,
    pins,
    midPins: pins,
    pcbBoard,
    topPads: pins,
    bottomPins,
    alignmentLines,
  };
}

/**
 * Splits an indexed BufferGeometry based on vertex classifications
 */
function splitMeshByClassification(mesh, classifier) {
  const geo = mesh.geometry;
  const index = geo.index;
  const triCount = index ? index.count / 3 : geo.attributes.position.count / 3;
  const subGroupIndices = new Map();

  for (let i = 0; i < triCount; i++) {
    const iA = index ? index.getX(i * 3) : i * 3;
    const iB = index ? index.getX(i * 3 + 1) : i * 3 + 1;
    const iC = index ? index.getX(i * 3 + 2) : i * 3 + 2;

    const groupKey = classifier(iA, iB, iC, geo);
    if (!subGroupIndices.has(groupKey)) {
      subGroupIndices.set(groupKey, []);
    }
    subGroupIndices.get(groupKey).push(iA, iB, iC);
  }

  const result = new Map();
  for (const [key, indices] of subGroupIndices) {
    const subGeo = new THREE.BufferGeometry();
    subGeo.setAttribute("position", geo.attributes.position);
    if (geo.attributes.normal) {
      subGeo.setAttribute("normal", geo.attributes.normal);
    }
    if (geo.attributes.uv) {
      subGeo.setAttribute("uv", geo.attributes.uv);
    }
    subGeo.setIndex(indices);
    result.set(key, subGeo);
  }

  return result;
}

/**
 * Recolor the 3D CPU/Chip model in-place
 */
export function recolorCpuModel(rootGroup, materials) {
  const meshesToReplace = [];

  const leftoverGuides = [];

  rootGroup.traverse((child) => {
    if (child.isLine || child.isLineSegments || child.isLineLoop) {
      leftoverGuides.push(child);
      return;
    }

    if (!child.isMesh) return;
    const mesh = child;
    const parent = mesh.parent;
    if (!parent) return;

    if (mesh.name.includes("Object_2")) {
      // Object_2: Top die/package
      const subGeos = splitMeshByClassification(mesh, (iA, _iB, _iC, geo) => {
        const u = geo.attributes.uv.getX(iA).toFixed(3);
        const v = geo.attributes.uv.getY(iA).toFixed(3);
        if (u === "0.851" && v === "0.352") return "text";
        return "package";
      });

      const newChildren = [];
      const packageGeo = subGeos.get("package");
      if (packageGeo) {
        const packageMesh = new THREE.Mesh(packageGeo, materials.topPackage);
        packageMesh.name = `${mesh.name}_package`;
        packageMesh.position.copy(mesh.position);
        packageMesh.rotation.copy(mesh.rotation);
        packageMesh.quaternion.copy(mesh.quaternion);
        packageMesh.scale.copy(mesh.scale);
        packageMesh.castShadow = true;
        packageMesh.receiveShadow = true;

        if (typeof document !== "undefined") {
          const textTexture = createAsasSoftTextTexture();
          const textMaterial = new THREE.MeshStandardMaterial({
            map: textTexture,
            transparent: true,
            alphaTest: 0.12,
            roughness: 0.2,
            metalness: 0.1,
            color: new THREE.Color("#ffffff"),
            emissive: new THREE.Color("#ffffff"),
            emissiveMap: textTexture,
            emissiveIntensity: 0.48,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2,
            depthWrite: true,
            side: THREE.FrontSide,
          });

          const textPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(1.5, 1.5),
            textMaterial,
          );
          textPlane.name = `${mesh.name}_asassoft_text`;
          textPlane.position.set(0.0, 0.0, 0.162);
          textPlane.rotation.set(0, 0, 0);
          textPlane.castShadow = false;
          textPlane.receiveShadow = true;
          packageMesh.add(textPlane);
        }

        newChildren.push(packageMesh);
      }

      meshesToReplace.push({ parent, oldChild: mesh, newChildren });
    } else if (mesh.name.includes("Object_4")) {
      // Two opposite edge-pin rows
      mesh.material = materials.pins;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    } else if (mesh.name.includes("Object_5")) {
      // UV islands:
      // 0.467,0.471 — remaining two edge-pin rows → white
      // 0.104,0.390 — back pins: flat circular pads (white) + pin legs (gold)
      // 0.810,0.061 — PCB board
      const subGeos = splitMeshByClassification(mesh, (iA, iB, iC, geo) => {
        const u = geo.attributes.uv.getX(iA).toFixed(3);
        const v = geo.attributes.uv.getY(iA).toFixed(3);
        if (u === "0.810" && v === "0.061") return "pcb_board";
        if (u === "0.467" && v === "0.471") return "pins_front";

        const nrm = geo.attributes.normal;
        const nz = (nrm.getZ(iA) + nrm.getZ(iB) + nrm.getZ(iC)) / 3;
        // Flat circular pad faces (±Z) stay white; cylindrical legs stay gold
        if (Math.abs(nz) > 0.55) return "pins_pads";
        return "pins_back";
      });

      const newChildren = [];

      const addPart = (key, material, nameSuffix) => {
        const partGeo = subGeos.get(key);
        if (!partGeo || !material) return;
        const m = new THREE.Mesh(partGeo, material);
        m.name = `${mesh.name}_${nameSuffix}`;
        m.position.copy(mesh.position);
        m.rotation.copy(mesh.rotation);
        m.quaternion.copy(mesh.quaternion);
        m.scale.copy(mesh.scale);
        m.castShadow = true;
        m.receiveShadow = true;
        newChildren.push(m);
      };

      addPart("pcb_board", materials.pcbBoard, "pcb_board");
      addPart("pins_front", materials.pins, "pins_front");
      addPart("pins_pads", materials.pins, "pins_pads");
      addPart("pins_back", materials.bottomPins || materials.pins, "pins_back");

      meshesToReplace.push({ parent, oldChild: mesh, newChildren });
    }
  });

  for (const item of meshesToReplace) {
    item.parent.remove(item.oldChild);
    for (const newChild of item.newChildren) {
      item.parent.add(newChild);
    }
  }

  for (const guide of leftoverGuides) {
    guide.removeFromParent();
    guide.geometry?.dispose();
  }
}
