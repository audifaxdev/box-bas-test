import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  PointLight,
  AmbientLight,
  AxesHelper,
} from 'three';
import OrbitControls from './controls/OrbitControls';
import loop from 'raf-loop';
import resize from 'brindille-resize';
import {TimelineMax} from 'gsap';
import BoxAnimation from './BoxAnimation';

const DEBUG = true;
let params = {
  strength: .5,
  radius: .4,
  threshold: .85
};

//Init
const container = document.body;
const renderer = new WebGLRenderer({
  antialias: true
});
// renderer.setClearColor(0xffffff);
renderer.setClearColor(0x323232);
container.style.overflow = 'hidden';
container.style.margin = 0;
container.appendChild(renderer.domElement);

const scene = new Scene();
const camera = new PerspectiveCamera(
  50, resize.width / resize.height, 0.1, 10000
);
const controls = new OrbitControls(camera, {
  element: renderer.domElement,
  parent: renderer.domElement,
  distance: 2
});
const frontLight = new PointLight(0xFFFFFF, 1);
const backLight = new PointLight(0xFFFFFF, 1);
scene.add(frontLight);
scene.add(new AmbientLight(0xf1ff1f1));
// scene.add(backLight);

let boxAnimation = new BoxAnimation();
let tl = new TimelineMax({
  repeat: 0,
  repeatDelay: 0.5,
  yoyo: true,
  paused: true
});

tl.to(boxAnimation, 1, {
  time: boxAnimation.duration,
  ease: Power0.easeIn,
}, 0);

tl.timeScale(1);

scene.add(boxAnimation.mesh);

//Resize
resize.addListener(function () {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

function render(dt) {
  controls.update();
  renderer.render(scene, camera);
}

//Final tweaks
frontLight.position.set(0, 0, 0);
// backLight.position.set(0, 0, -10);

//Start rendering
document.addEventListener('DOMContentLoaded', () => {

  document.getElementsByTagName('body')[0].addEventListener('click', function () {
    tl.play();
  });

  loop(render).start();
});

//Debug
if (DEBUG) {
  scene.add(new AxesHelper(5000));
}