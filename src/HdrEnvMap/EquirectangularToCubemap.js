import * as THREE from 'three';

class EquirectangularToCubemap{

  constructor(renderer) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();

    let gl = this.renderer.getContext();
    this.maxSize = gl.getParameter( gl.MAX_CUBE_MAP_TEXTURE_SIZE )

    this.camera = new THREE.CubeCamera( 1, 100000, 1 );

    this.material = new THREE.MeshBasicMaterial( {
      map: null,
      side: THREE.BackSide
    } );

    this.mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry( 100, 4 ),
      this.material
    );
    this.scene.add( this.mesh );

  }

  convert(source, size) {
    let mapSize = Math.min( size, this.maxSize );
    this.camera = new THREE.CubeCamera( 1, 100000, mapSize );
    this.material.map = source;

    this.camera.updateCubeMap( this.renderer, this.scene );

    return this.camera.renderTarget.texture;
  }
}

export default EquirectangularToCubemap;