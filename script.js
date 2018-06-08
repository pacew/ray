var camera, scene, renderer;

function dtor (x) {return (x / 360.0 * 2 * Math.PI); }

const tower_height = 6; /* meters */
const boom_length = 4; /* meters */
const boom_diam = .2; /* meters */

var hub_angle = 0; /* radians */
const hub_period = 100; /* seconds */


const body_l = 2;
const body_w = 1;

function axes () {
  const axis_len = tower_height * 2;
  const axis_r = .05;
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

var hub;
var boom;
var body;

var canvas, ctx;

function make_canvas () {
  canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  ctx = canvas.getContext('2d');
  update_canvas ();
}

function update_canvas() {
  ctx.font = '20pt Arial';
  ctx.fillStyle = 'red';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.fillRect(10, 10, canvas.width - 20, canvas.height - 20);
  ctx.fillStyle = 'black';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(new Date().getTime(), canvas.width / 2, canvas.height / 2);

  for (let row = 0; row < 100; row++) {
    for (let col = 0; col < 100; col++) {
      let x = 10 + row * 10;
      let y = 10 + col * 10;
      
      ctx.beginPath ();
      ctx.fillStyle = "green";
      ctx.fillRect (x, y, 5, 5);
    }
  }
  

}


var body_texture;

function make_model () {
  let geo, mat;
  
  make_canvas ();

  geo = new THREE.BoxGeometry( 1, 1, .2 );
  mat = new THREE.MeshBasicMaterial( {color: 0x444444 } );
  hub = new THREE.Mesh( geo, mat )
    .translateZ (tower_height);
  scene.add (hub);

  geo = new THREE.CylinderGeometry(boom_diam/2, boom_diam/2, boom_length);
  mat = new THREE.MeshBasicMaterial( {color: 0xffff00} );
  boom = new THREE.Mesh( geo, mat )
    .translateY (boom_length / 2);

  hub.add (boom);

  /* body */
  body_texture = new THREE.Texture (canvas);

  geo = new THREE.BoxGeometry( body_l, body_w, .05 );
  mat = new THREE.MeshBasicMaterial ( { map: body_texture } );
  body = new THREE.Mesh( geo, mat )
    .translateY (boom_length / 2 + body_w / 2);
  boom.add( body );
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

  scene.add (new THREE.GridHelper( tower_height * 3, 30, 0xffffff, 0x444444 )
	     .rotateX (dtor (90)));

  make_model ();

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );
  document.body.appendChild( canvas );

  hub_angle = dtor (160);
}

var last_t = new Date () / 1000.0;

function animate() {
  requestAnimationFrame( animate );

  let t = new Date() / 1000.0;
  let delta_t = t - last_t;
  if (delta_t > 0) {
    last_t = t;
    
    update_canvas ();
    body_texture.needsUpdate = true;

    hub_angle += delta_t / hub_period * 2 * Math.PI 
    hub_angle %= 2 * Math.PI;
    hub.setRotationFromAxisAngle (new THREE.Vector3 (0, 0, 1), hub_angle);

  }
  

  renderer.render( scene, camera );
}

$(function () {
  init();
  animate();
});

