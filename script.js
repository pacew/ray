var camera, scene, renderer;

function dtor (x) {return (x / 360.0 * 2 * Math.PI); }

const tower_height = 6; /* meters */
const boom_length = 4; /* meters */
const boom_diam = .2; /* meters */
var boom_angle = 0; /* radians */
const boom_period = 10; /* seconds */

function axes () {
  const axis_len = tower_height * 1.5;
  const axis_r = axis_len * .01;
  var geo, mat, xaxis, yaxis, zaxis;

  geo = new THREE.CylinderGeometry(axis_r, axis_r, axis_len);
  mat = new THREE.MeshBasicMaterial( {color: 0xff0000} );
  xaxis = new THREE.Mesh( geo, mat )
    .rotateZ(dtor (90))
    .translateY (- axis_len / 2);

  geo = new THREE.CylinderGeometry(axis_r, axis_r, axis_len);
  mat = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
  yaxis = new THREE.Mesh( geo, mat )
    .translateY (axis_len / 2);

  geo = new THREE.CylinderGeometry(axis_r, axis_r, axis_len);
  mat = new THREE.MeshBasicMaterial( {color: 0x0000ff} );
  zaxis = new THREE.Mesh( geo, mat )
    .rotateX (dtor (90))
    .translateY (axis_len / 2);
  
  
  
  scene.add( xaxis );
  scene.add( yaxis );
  scene.add( zaxis );

}

var boom;

function make_model () {
  let geo, mat;
  
  geo = new THREE.CylinderGeometry(boom_diam/2, boom_diam/2, boom_length);
  mat = new THREE.MeshBasicMaterial( {color: 0xffff00} );
  boom = new THREE.Mesh( geo, mat )
    .translateZ (tower_height);


  scene.add (boom);
}


function init() {
  camera = new THREE.PerspectiveCamera( 70, 
					window.innerWidth / window.innerHeight,
					0.01, 
					tower_height * 3 )

  camera.up.set (0, 0, 1);

  camera.translateX (3);
  camera.translateY (-tower_height * 1.5);
  camera.translateZ (1.7);
    
  camera.lookAt (0, 0, tower_height * .8);

  scene = new THREE.Scene();

  axes ();

  var grid = new THREE.GridHelper( tower_height * 3, 30, 0xffffff, 0x444444 )
      .rotateX (dtor (90));
  scene.add( grid );

  make_model ();

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );
}

var last_t = new Date () / 1000.0;

function animate() {
  requestAnimationFrame( animate );

  let t = new Date() / 1000.0;
  let delta_t = t - last_t;
  if (delta_t > 0) {
    last_t = t;
    
    boom_angle += delta_t / boom_period * 2 * Math.PI 
    boom_angle %= 2 * Math.PI;

    boom.position.setX (0);
    boom.position.setY (0);
    boom.setRotationFromAxisAngle (new THREE.Vector3 (0, 0, 1), boom_angle);
    boom.translateY (boom_length / 2);
  }
  

  renderer.render( scene, camera );
}

$(function () {
  init();
  animate();
});

