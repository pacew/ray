'use strict';

var camera, scene, renderer;

function dtor (x) {return (x / 360.0 * 2 * Math.PI); }

const tower_height = 6; /* meters */
const boom_length = 4; /* meters */
const boom_diam = .2; /* meters */

var hub_angle = 0; /* radians */
const hub_period = 15; /* seconds */

const sky_radius = 30; /* meters */

const body_l = 2;
const body_w = 1;

function axes () {
  const axis_len = tower_height;
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
  mat = new THREE.MeshBasicMaterial( {color: 0x000044} );
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

var img_data;

function make_canvas () {
  canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  ctx = canvas.getContext('2d');

  img_data = ctx.createImageData (128, 128);

  update_canvas ();
}

function lscale (x, from_min, from_max, to_min, to_max) {
  return ((x - from_min) / (from_max - from_min) * (to_max - to_min) + to_min);
}

var body_texture;

function update_canvas() {
  let row, col, idx;
  let arr;

  arr = img_data.data;
  idx = 0;
  for (row = 0; row < 128; row++) {
    for (col = 0; col < 128; col++) {
      arr[idx++] = row;
      arr[idx++] = col;
      arr[idx++] = 128;
      arr[idx++] = 255;
    }
  }

  let secs = new Date().getTime() / 10000;
  let freq = 2;

  row = 64;
  for (col = 0; col < 128 - 4; col++) {
    let s = col / 128 * 2 * 2 * Math.PI;
    s += secs * 40;
    let h = Math.floor (20 * Math.sin (s));
      
    for (let row_off = 0; row_off < 4; row_off++) {
      for (let col_off = 0; col_off < 4; col_off++) {
	idx = ((row + h + row_off) * 128 + col + col_off) * 4;
	arr[idx++] = 255;
	arr[idx++] = 255;
	arr[idx++] = 0;
	arr[idx++] = 255;
      }
    }
  }
  
  ctx.putImageData (img_data, 0, 0);



}

var segs;

function make_ray () {
  let geo, mat;
  
  let ray = new THREE.Group ();

  const nsegs = 8;
  const total_length = 2;
  const body_width = .5;

  const length_reduction = .9;
  const width_reduction = .6;

  let lengths = [];
  let widths = [];
  let len = total_length;
  let wid = body_width / 2;
  let total_width = 0;
  for (let idx = 0; idx < nsegs / 2; idx++) {
    lengths[idx] = len;
    widths[idx] = wid;

    total_width += wid;
    
    len *= length_reduction;
    wid *= width_reduction;
  }
  total_width *= 2;

  segs = [];
  let seg;

  let xoffset = 0;
  for (let idx = 0; idx < nsegs; idx++) {
    seg = {};
    seg.idx = idx;
    seg.prev = null;

    if (idx < nsegs / 2) {
      seg.dir = -1;
      seg.size_idx = (nsegs / 2) - idx - 1;
    } else {
      seg.dir = 1;
      seg.size_idx = idx - (nsegs / 2);
    }
    seg.length = lengths[seg.size_idx];
    seg.width = widths[seg.size_idx];
    
    if (seg.dir == -1) {
      seg.u0 = (xoffset + seg.width) / total_width;
      seg.u1 = xoffset / total_width;
    } else {
      seg.u0 = xoffset / total_width;
      seg.u1 = (xoffset + seg.width) / total_width;
    }
    xoffset += seg.width;

    let yoffset = (total_length - seg.length) / 2;

    seg.v0 = yoffset / total_length;
    seg.v1 = (yoffset + seg.length) / total_length;

    geo = new THREE.Geometry ();
    geo.vertices.push (
      new THREE.Vector3 (0,                    -seg.length/2, 0),
      new THREE.Vector3 (0,                     seg.length/2, 0),
      new THREE.Vector3 (seg.width * seg.dir,   seg.length/2, 0),
      new THREE.Vector3 (seg.width * seg.dir , -seg.length/2, 0)
    );
    geo.faces.push (new THREE.Face3 (0, 1, 2));
    geo.faces.push (new THREE.Face3 (2, 3, 0));

    let map = [];
    map.push ([
      new THREE.Vector2 (seg.u0, seg.v0),
      new THREE.Vector2 (seg.u0, seg.v1),
      new THREE.Vector2 (seg.u1, seg.v1)
    ]);

    map.push ([
      new THREE.Vector2 (seg.u1, seg.v1),
      new THREE.Vector2 (seg.u1, seg.v0),
      new THREE.Vector2 (seg.u0, seg.v0)
    ]);

    geo.faceVertexUvs = [ map ];

    mat = new THREE.MeshBasicMaterial ({map: body_texture});
    mat.side = THREE.DoubleSide;

    seg.mesh = new THREE.Mesh (geo, mat);

    segs[idx] = seg;
  }

  for (let idx = nsegs / 2 + 1; idx < nsegs; idx++) {
    seg = segs[idx];
    seg.prev = segs[idx - 1];
  }
  for (let idx = nsegs / 2 - 2; idx >= 0; idx--) {
    seg = segs[idx];
    seg.prev = segs[idx + 1];
  }

  for (let idx = 0; idx < nsegs; idx++) {
    seg = segs[idx];
    if (seg.prev) {
      seg.mesh.translateX (seg.prev.width * seg.dir);
      seg.prev.mesh.add (seg.mesh);
    }
  }
  

  for (let idx = 0; idx < nsegs; idx++) {
    seg = segs[idx];
    if (! seg.prev) {
      ray.add (seg.mesh);
    }
  }

  scene.add (ray);

}

function make_model () {
  let geo, mat;
  
  make_canvas ();

  geo = new THREE.BoxGeometry( 1, 1, .2 );
  mat = new THREE.MeshBasicMaterial( {color: 0x111111 } );
  hub = new THREE.Mesh( geo, mat )
    .translateZ (tower_height);
  scene.add (hub);

  geo = new THREE.CylinderGeometry(boom_diam/2, boom_diam/2, boom_length);
  mat = new THREE.MeshBasicMaterial( {color: 0x222222} );
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

  make_ray ();

}

var sky_canvas;
var sky_ctx;
var sky_img;
var sky_texture;
var sky;

function update_sky () {
  let row, col, idx;
  let arr;

  arr = sky_img.data;
  idx = 0;
  for (row = 0; row < sky_canvas.height; row++) {
    for (col = 0; col < sky_canvas.width; col++) {
      arr[idx++] = row;
      arr[idx++] = col;
      arr[idx++] = 128;
      arr[idx++] = 255;
    }
  }

  sky_ctx.putImageData (sky_img, 0, 0);
}

function make_sky () {
  let geo, mat;

  sky_canvas = document.createElement("canvas");
  sky_canvas.width = sky_canvas.height = 512;
  sky_ctx = sky_canvas.getContext('2d');
  sky_img = ctx.createImageData (sky_canvas.width, sky_canvas.height);

  update_sky ();

  sky_texture = new THREE.Texture (sky_canvas);
  
  geo = new THREE.SphereGeometry (sky_radius, 32, 32);

  if (false) {
    mat = new THREE.MeshBasicMaterial ( {map: sky_texture } );
  } else {
    mat = new THREE.MeshBasicMaterial ();
    mat.map = new THREE.TextureLoader().load ('galaxy_starfield.png');
  }
  mat.side = THREE.BackSide;
  sky = new THREE.Mesh (geo, mat);
  scene.add (sky);


}

function init() {
  let w, h;

  if (window.innerWidth > window.innerHeight) {
    w = window.innerWidth;
    h = window.innerHeight;
  } else {
    w = window.innerWidth;
    h = w;
  }

  camera = new THREE.PerspectiveCamera( 30, /* degrees */
					w / h,
					0.01, 
					sky_radius * 2)

  if (0) {
    camera.translateX (3);
    camera.translateY (-boom_length * .9);
    camera.translateZ (1);
    camera.up.set (0, 0, 1);
    camera.lookAt (2.7, -boom_length * .75, tower_height * .35);
  } else {
    camera.translateX (.5);
    camera.translateY (-boom_length * 1);
    camera.translateZ (.5);
    camera.up.set (0, 0, 1);
    camera.lookAt (0, 0, 0);
  }

  scene = new THREE.Scene();

  axes ();

  scene.add (new THREE.GridHelper( tower_height * 3, 30, 0xffffff, 0x444444 )
	     .rotateX (dtor (90)));

  make_model ();
  make_sky ();

  renderer = new THREE.WebGLRenderer( { antialias: true } );

  renderer.setSize(w, h);

  document.body.appendChild (renderer.domElement);
  if (false) {
    document.body.appendChild (canvas);
    document.body.appendChild (sky_canvas);
  }

  hub_angle = dtor (180);
}

var last_t = new Date () / 1000.0;

function animate() {
  requestAnimationFrame( animate );

  let t = new Date() / 1000.0;
  let delta_t = t - last_t;
  if (delta_t > 0) {
    last_t = t;
    
    sky.rotateOnAxis (new THREE.Vector3 (1,1,1), delta_t * -.0015);


    update_canvas ();
    body_texture.needsUpdate = true;
    sky_texture.needsUpdate = true;

    hub_angle += delta_t / hub_period * 2 * Math.PI 
    hub_angle %= 2 * Math.PI;
    hub.setRotationFromAxisAngle (new THREE.Vector3 (0, 0, 1), hub_angle);

    if (true) {
      for (let idx = 0; idx < segs.length; idx++) {
	let seg = segs[idx];
	if (seg.prev) {
	  seg.mesh.setRotationFromAxisAngle (
	    new THREE.Vector3 (0, 1, 0), 
	    lscale (Math.sin (t * 2), 
		    -1, 1, 
		    0, seg.dir * dtor (-10 * seg.size_idx)));
	}
      }
    }
  }
  

  renderer.render( scene, camera );
}

$(function () {
  init();
  animate();
});

