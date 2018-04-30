import * as THREE from 'three';
import {
  ModelBufferGeometry,
  PhongAnimationMaterial,
  ShaderChunk,
  Utils as BASUtils
} from 'three-bas';

class BoxModelBufferGeometry extends ModelBufferGeometry {
  constructor(geometry) {
    super(geometry);
  }
  bufferPositions() {
    let positionBuffer = this.createAttribute('position', 3).array;

    for (let i = 0; i < this.faceCount; i++) {
      let face = this.modelGeometry.faces[i];
      let centroid = BASUtils.computeCentroid(this.modelGeometry, face);

      let a = this.modelGeometry.vertices[face.a];
      let b = this.modelGeometry.vertices[face.b];
      let c = this.modelGeometry.vertices[face.c];

      positionBuffer[face.a * 3] = a.x - centroid.x;
      positionBuffer[face.a * 3 + 1] = a.y - centroid.y;
      positionBuffer[face.a * 3 + 2] = a.z - centroid.z;

      positionBuffer[face.b * 3] = b.x - centroid.x;
      positionBuffer[face.b * 3 + 1] = b.y - centroid.y;
      positionBuffer[face.b * 3 + 2] = b.z - centroid.z;

      positionBuffer[face.c * 3] = c.x - centroid.x;
      positionBuffer[face.c * 3 + 1] = c.y - centroid.y;
      positionBuffer[face.c * 3 + 2] = c.z - centroid.z;
    }
  }
}

class BoxAnimation {
  constructor() {
    let boxGeometry = new THREE.BoxGeometry(1, 1, 1, 1, 1, 1);
    boxGeometry.computeBoundingBox();
    // tesselate(boxGeometry, 1.0);
    BASUtils.separateFaces(boxGeometry);

    let faceCount = boxGeometry.faces.length;

    let bufferGeometry =  new BoxModelBufferGeometry(
      boxGeometry, { computeCentroids: true }
    );

    let aAnimation = bufferGeometry.createAttribute('aAnimation', 2);
    let aStartPosition = bufferGeometry.createAttribute('aStartPosition', 3);
    let aEndPosition = bufferGeometry.createAttribute('aEndPosition', 3);
    let aAxisAngle = bufferGeometry.createAttribute('aAxisAngle', 4);

    let axis = new THREE.Vector3();
    let angle;

    let centroidLocal = new THREE.Vector3();
    let delta = new THREE.Vector3();

    let l = faceCount;

    let delay = 0;

    let i, i2, i3, i4, v;

    // let duration = THREE.Math.randFloat(minDuration, maxDuration);
    let duration = 2.0;

    for (i = 0, i2 = 0, i3 = 0, i4 = 0; i < l; i++, i2 += 6, i3 += 9, i4 += 12) {

      let face = boxGeometry.faces[i];
      let centroid = BASUtils.computeCentroid(bufferGeometry.modelGeometry, face);

      // animation

      for (v = 0; v < 6; v += 2) {
        aAnimation.array[i2 + v] = delay;
        aAnimation.array[i2 + v + 1] = duration;
      }

      // start position (centroid)
      for (v = 0; v < 9; v += 3) {
        aEndPosition.array[i3 + v] = centroid.x;
        aEndPosition.array[i3 + v + 1] = centroid.y;
        aEndPosition.array[i3 + v + 2] = centroid.z;
      }

      // end position
      centroidLocal.copy(centroid);
      delta.subVectors(new THREE.Vector3(0,0,0), centroidLocal);

      // console.log({
      //   delta, centroid
      // });

      // delta.y += THREE.Math.randFloatSpread(10.0);

      let x = delta.x * THREE.Math.randFloat(4.0, 12.0);
      let y = delta.y * THREE.Math.randFloat(4.0, 12.0);
      let z = delta.z * THREE.Math.randFloat(4.0, 12.0);

      // let endPosition = new THREE.Vector3(centroid.x+x, centroid.y+y, centroid.z+z);
      let endPosition = centroid.multiplyScalar(7);

      for (v = 0; v < 9; v += 3) {
        aStartPosition.array[i3 + v] = endPosition.x;
        aStartPosition.array[i3 + v + 1] = endPosition.y;
        aStartPosition.array[i3 + v + 2] = endPosition.z;
      }

      console.log({
        face, startPosition: centroid, axis, endPosition
      });

      // axis angle
      axis.x = THREE.Math.randFloatSpread(2);
      axis.y = THREE.Math.randFloatSpread(2);
      axis.z = THREE.Math.randFloatSpread(2);
      axis.normalize();
      angle = Math.PI * THREE.Math.randFloat(4.0, 8.0);

      // axis.x = 1;
      // axis.y = 1;
      // axis.z = 1;
      // axis.normalize();
      // angle = Math.PI;

      for (v = 0; v < 12; v += 4) {
        aAxisAngle.array[i4 + v] = axis.x;
        aAxisAngle.array[i4 + v + 1] = axis.y;
        aAxisAngle.array[i4 + v + 2] = axis.z;
        aAxisAngle.array[i4 + v + 3] = angle;
      }
    }

    let material = new PhongAnimationMaterial({
      // wireframe: true,
      shading: THREE.FlatShading,
      side: THREE.DoubleSide,
      transparent: false,
      uniforms: {
        uTime: {
          type: 'f',
          value: 0
        }
      },
      vertexFunctions: [
        ShaderChunk['cubic_bezier'],
        ShaderChunk['ease_out_cubic'],
        ShaderChunk['quaternion_rotation']
      ],
      vertexParameters: `
        uniform float uTime;
        uniform vec3 uAxis;
        uniform float uAngle;
        attribute vec2 aAnimation;
        attribute vec3 aStartPosition;
        attribute vec3 aEndPosition;
        attribute vec4 aAxisAngle;
      `,
      vertexInit: `
        float tDelay = aAnimation.x;
        float tDuration = aAnimation.y;
        float tTime = clamp(uTime - tDelay, 0.0, tDuration);
        float tProgress = tTime / tDuration;
      `,
      vertexPosition: `
        // scale
        transformed *= tProgress;
        // rotate
        float angle = aAxisAngle.w * (1.0 - tProgress);
        vec4 tQuat = quatFromAxisAngle(aAxisAngle.xyz, angle);
        transformed = rotateVector(tQuat, transformed);
  
        // translate
        transformed += mix(aStartPosition, aEndPosition, tProgress);
      `
    }, {
      // diffuse: 0x444444,
      // specular: 0xcccccc,
      // shininess: 4,
      // emissive: 0x444444
    });
    this.mesh = new THREE.Mesh(bufferGeometry, material);
    this.duration = duration;
    this.material = material;
    this.frustumCulled = false;
  }
}

Object.defineProperty(BoxAnimation.prototype, 'time', {
  get: function() {
    return this.material.uniforms['uTime'].value;
  },
  set: function(v) {
    // console.log('BoxAnimation::setTime', v);
    this.material.uniforms['uTime'].value = v;
  }
});

export default BoxAnimation;