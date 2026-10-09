import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

type Dice3DProps = {
  size: number;
  onReady: () => void;
  onRollComplete: (value: number) => void;
  onError: (error: Error) => void;
};

export type Dice3DHandle = {
  roll: (value: number) => boolean;
};

type Rotation = { x: number; y: number; z: number };
type RollAnimation = { from: Rotation; to: Rotation; startedAt: number; duration: number; value: number };
type Renderer = {
  gl: ExpoWebGLRenderingContext;
  program: WebGLProgram;
  buffer: WebGLBuffer;
  positionAttribute: number;
  normalAttribute: number;
  colorAttribute: number;
  modelUniform: WebGLUniformLocation;
  mvpUniform: WebGLUniformLocation;
  vertexCount: number;
  frameId: number;
};

const FACE_LAYOUTS = [
  { value: 1, normal: [0, 0, 1], right: [1, 0, 0], up: [0, 1, 0], dots: [[0, 0]] },
  { value: 6, normal: [0, 0, -1], right: [-1, 0, 0], up: [0, 1, 0], dots: [[-0.28, -0.28], [-0.28, 0], [-0.28, 0.28], [0.28, -0.28], [0.28, 0], [0.28, 0.28]] },
  { value: 3, normal: [1, 0, 0], right: [0, 0, -1], up: [0, 1, 0], dots: [[-0.28, -0.28], [0, 0], [0.28, 0.28]] },
  { value: 4, normal: [-1, 0, 0], right: [0, 0, 1], up: [0, 1, 0], dots: [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]] },
  { value: 5, normal: [0, 1, 0], right: [1, 0, 0], up: [0, 0, -1], dots: [[-0.28, -0.28], [0.28, -0.28], [0, 0], [-0.28, 0.28], [0.28, 0.28]] },
  { value: 2, normal: [0, -1, 0], right: [1, 0, 0], up: [0, 0, 1], dots: [[-0.28, -0.28], [0.28, 0.28]] },
] as const;

const FACE_ROTATIONS: Record<number, Rotation> = {
  1: { x: 0, y: 0, z: 0 },
  2: { x: -Math.PI / 2, y: 0, z: 0 },
  3: { x: 0, y: -Math.PI / 2, z: 0 },
  4: { x: 0, y: Math.PI / 2, z: 0 },
  5: { x: Math.PI / 2, y: 0, z: 0 },
  6: { x: 0, y: Math.PI, z: 0 },
};

const TAU = Math.PI * 2;
const ROLL_DURATION_MS = 1050;
const INITIAL_ROTATION = { x: -0.48, y: 0.56, z: 0.08 };
const RESTING_TILT = { x: 0.4, y: 0.42, z: 0 };

const vertexData = (position: readonly number[], normal: readonly number[], color: readonly number[]) => [
  ...position,
  ...normal,
  ...color,
];

const makeGeometry = () => {
  const vertices: number[] = [];
  const white = [0.96, 0.96, 0.94];
  const black = [0.025, 0.025, 0.025];
  const addVertex = (
    position: readonly number[],
    normal: readonly number[],
    color: readonly number[],
  ) => {
    vertices.push(...vertexData(position, normal, color));
  };
  const facePoint = (
    face: typeof FACE_LAYOUTS[number],
    horizontal: number,
    vertical: number,
    offset: number,
  ) => face.normal.map((component, index) =>
    component * (0.5 + offset) + face.right[index] * horizontal + face.up[index] * vertical,
  );

  FACE_LAYOUTS.forEach((face) => {
    const center = facePoint(face, 0, 0, 0);
    const corners = [
      [-0.49, -0.49],
      [0.49, -0.49],
      [0.49, 0.49],
      [-0.49, 0.49],
    ];
    for (let index = 0; index < corners.length; index++) {
      const first = corners[index];
      const second = corners[(index + 1) % corners.length];
      addVertex(center, face.normal, white);
      addVertex(facePoint(face, first[0], first[1], 0), face.normal, white);
      addVertex(facePoint(face, second[0], second[1], 0), face.normal, white);
    }

    face.dots.forEach(([horizontal, vertical]) => {
      const dotCenter = facePoint(face, horizontal, vertical, 0.003);
      const segments = 16;
      const radius = 0.1;
      for (let index = 0; index < segments; index++) {
        const firstAngle = index / segments * TAU;
        const secondAngle = (index + 1) / segments * TAU;
        addVertex(dotCenter, face.normal, black);
        addVertex(
          facePoint(face, horizontal + Math.cos(firstAngle) * radius, vertical + Math.sin(firstAngle) * radius, 0.003),
          face.normal,
          black,
        );
        addVertex(
          facePoint(face, horizontal + Math.cos(secondAngle) * radius, vertical + Math.sin(secondAngle) * radius, 0.003),
          face.normal,
          black,
        );
      }
    });
  });

  return new Float32Array(vertices);
};

const multiplyMatrices = (left: number[], right: number[]) => {
  const result = new Array<number>(16).fill(0);
  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 4; row++) {
      for (let index = 0; index < 4; index++) {
        result[column * 4 + row] += left[index * 4 + row] * right[column * 4 + index];
      }
    }
  }
  return result;
};

const rotationMatrix = ({ x, y, z }: Rotation) => {
  const sx = Math.sin(x);
  const cx = Math.cos(x);
  const sy = Math.sin(y);
  const cy = Math.cos(y);
  const sz = Math.sin(z);
  const cz = Math.cos(z);
  const rotateX = [1, 0, 0, 0, 0, cx, sx, 0, 0, -sx, cx, 0, 0, 0, 0, 1];
  const rotateY = [cy, 0, -sy, 0, 0, 1, 0, 0, sy, 0, cy, 0, 0, 0, 0, 1];
  const rotateZ = [cz, sz, 0, 0, -sz, cz, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  return multiplyMatrices(rotateZ, multiplyMatrices(rotateY, rotateX));
};

const perspectiveMatrix = (aspect: number) => {
  const fieldOfView = Math.PI / 4;
  const focalLength = 1 / Math.tan(fieldOfView / 2);
  const near = 0.1;
  const far = 10;
  return [
    focalLength / aspect, 0, 0, 0,
    0, focalLength, 0, 0,
    0, 0, (far + near) / (near - far), -1,
    0, 0, (2 * far * near) / (near - far), 0,
  ];
};

const translationMatrix = (x: number, y: number, z: number) => [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  x, y, z, 1,
];

const scaleMatrix = (scale: number) => [
  scale, 0, 0, 0,
  0, scale, 0, 0,
  0, 0, scale, 0,
  0, 0, 0, 1,
];

const compileShader = (
  gl: ExpoWebGLRenderingContext,
  type: number,
  source: string,
) => {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to create a die shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Unknown shader compilation error.';
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
};

const createRenderer = (gl: ExpoWebGLRenderingContext): Renderer => {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec3 aColor;
    uniform mat4 uModel;
    uniform mat4 uMvp;
    varying vec3 vColor;
    varying vec3 vNormal;
    void main() {
      gl_Position = uMvp * vec4(aPosition, 1.0);
      vNormal = normalize(mat3(uModel) * aNormal);
      vColor = aColor;
    }
  `);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec3 vColor;
    varying vec3 vNormal;
    void main() {
      vec3 lightDirection = normalize(vec3(-0.45, 0.7, 1.0));
      float light = 0.28 + 0.72 * max(dot(normalize(vNormal), lightDirection), 0.0);
      gl_FragColor = vec4(vColor * light, 1.0);
    }
  `);
  const program = gl.createProgram();
  if (!program) throw new Error('Unable to create the die shader program.');
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || 'Unknown shader linking error.';
    gl.deleteProgram(program);
    throw new Error(message);
  }

  const buffer = gl.createBuffer();
  if (!buffer) throw new Error('Unable to create the die geometry buffer.');
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  const geometry = makeGeometry();
  gl.bufferData(gl.ARRAY_BUFFER, geometry, gl.STATIC_DRAW);
  gl.useProgram(program);

  const positionAttribute = gl.getAttribLocation(program, 'aPosition');
  const normalAttribute = gl.getAttribLocation(program, 'aNormal');
  const colorAttribute = gl.getAttribLocation(program, 'aColor');
  const modelUniform = gl.getUniformLocation(program, 'uModel');
  const mvpUniform = gl.getUniformLocation(program, 'uMvp');
  if ([positionAttribute, normalAttribute, colorAttribute].some((attribute) => attribute < 0)
    || !modelUniform || !mvpUniform) {
    throw new Error('Unable to locate a required die shader input.');
  }

  const stride = 9 * Float32Array.BYTES_PER_ELEMENT;
  gl.enableVertexAttribArray(positionAttribute);
  gl.vertexAttribPointer(positionAttribute, 3, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(normalAttribute);
  gl.vertexAttribPointer(normalAttribute, 3, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);
  gl.enableVertexAttribArray(colorAttribute);
  gl.vertexAttribPointer(colorAttribute, 3, gl.FLOAT, false, stride, 6 * Float32Array.BYTES_PER_ELEMENT);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clearColor(0, 0, 0, 0);

  return {
    gl,
    program,
    buffer,
    positionAttribute,
    normalAttribute,
    colorAttribute,
    modelUniform,
    mvpUniform,
    vertexCount: geometry.length / 9,
    frameId: 0,
  };
};

const Dice3D = forwardRef<Dice3DHandle, Dice3DProps>(function Dice3D(
  { size, onReady, onRollComplete, onError },
  ref,
) {
  const rendererRef = useRef<Renderer | null>(null);
  const rotationRef = useRef<Rotation>(INITIAL_ROTATION);
  const animationRef = useRef<RollAnimation | null>(null);
  const drawFrameRef = useRef<(() => void) | null>(null);
  const onReadyRef = useRef(onReady);
  const onRollCompleteRef = useRef(onRollComplete);
  const onErrorRef = useRef(onError);
  onReadyRef.current = onReady;
  onRollCompleteRef.current = onRollComplete;
  onErrorRef.current = onError;

  useImperativeHandle(ref, () => ({
    roll(value) {
      if (!rendererRef.current || animationRef.current || !FACE_ROTATIONS[value]) return false;
      const from = rotationRef.current;
      const faceRotation = FACE_ROTATIONS[value];
      const extraSpins = 2 + Math.floor(Math.random() * 2);
      const to = {
        x: faceRotation.x + RESTING_TILT.x
          + (Math.floor((from.x - faceRotation.x - RESTING_TILT.x) / TAU) + extraSpins + 1) * TAU,
        y: faceRotation.y + RESTING_TILT.y
          + (Math.floor((from.y - faceRotation.y - RESTING_TILT.y) / TAU) + extraSpins + 1) * TAU,
        z: (Math.floor(from.z / TAU) + extraSpins + 1) * TAU,
      };
      animationRef.current = { from, to, startedAt: Date.now(), duration: ROLL_DURATION_MS, value };
      if (rendererRef.current.frameId === 0 && drawFrameRef.current) {
        rendererRef.current.frameId = requestAnimationFrame(drawFrameRef.current);
      }
      return true;
    },
  }), []);

  useEffect(() => () => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    if (renderer.frameId !== 0) cancelAnimationFrame(renderer.frameId);
    renderer.gl.deleteBuffer(renderer.buffer);
    renderer.gl.deleteProgram(renderer.program);
    rendererRef.current = null;
  }, []);

  const handleContextCreate = (gl: ExpoWebGLRenderingContext) => {
    try {
      const renderer = createRenderer(gl);
      rendererRef.current = renderer;
      const drawFrame = () => {
        if (rendererRef.current !== renderer) return;
        const { drawingBufferWidth, drawingBufferHeight } = gl;
        gl.viewport(0, 0, drawingBufferWidth, drawingBufferHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(renderer.program);

        const animation = animationRef.current;
        let rotation = rotationRef.current;
        let bounceHeight = 0;
        if (animation) {
          const elapsed = Math.min(1, (Date.now() - animation.startedAt) / animation.duration);
          const eased = 1 - Math.pow(1 - elapsed, 3);
          bounceHeight = Math.sin(elapsed * Math.PI) * 0.18;
          rotation = {
            x: animation.from.x + (animation.to.x - animation.from.x) * eased,
            y: animation.from.y + (animation.to.y - animation.from.y) * eased,
            z: animation.from.z + (animation.to.z - animation.from.z) * eased,
          };
          if (elapsed === 1) {
            rotation = animation.to;
            rotationRef.current = rotation;
            animationRef.current = null;
          }
        }

        const model = multiplyMatrices(
          translationMatrix(0, bounceHeight, 0),
          multiplyMatrices(rotationMatrix(rotation), scaleMatrix(1.4)),
        );
        const view = translationMatrix(0, 0, -3.8);
        const projection = perspectiveMatrix(drawingBufferWidth / drawingBufferHeight);
        const mvp = multiplyMatrices(projection, multiplyMatrices(view, model));
        gl.uniformMatrix4fv(renderer.modelUniform, false, new Float32Array(model));
        gl.uniformMatrix4fv(renderer.mvpUniform, false, new Float32Array(mvp));
        gl.drawArrays(gl.TRIANGLES, 0, renderer.vertexCount);
        gl.flush();
        gl.endFrameEXP();

        if (animation && !animationRef.current) {
          onRollCompleteRef.current(animation.value);
        }
        renderer.frameId = animationRef.current ? requestAnimationFrame(drawFrame) : 0;
      };

      drawFrameRef.current = drawFrame;
      onReadyRef.current();
      drawFrame();
    } catch (error) {
      const rendererError = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to initialize the 3D die renderer.', rendererError);
      onErrorRef.current(rendererError);
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size + 8 }]}>
      <GLView
        pointerEvents="none"
        msaaSamples={4}
        onContextCreate={handleContextCreate}
        style={{ width: size, height: size, backgroundColor: 'transparent' }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'visible',
  },
});

export default Dice3D;
