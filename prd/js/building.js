var camera, scene, renderer;
var mouseX = 0, mouseY = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var object;
var pivotX, pivotY // X轴，Y轴
var press32 = false
var isDrawLine = false
var itemObjArr = []
var isStop = false
var isStopSpace = false
var memoryArr= []
function Building(container, item_arr) {
    // 页面点更新的速度，低、中、高
    this.FREAH_RATE_LOW = 600
    this.FREAH_RATE_MIDDLE = 400
    this.FREAH_RATE_HIGH = 200
    this.freahRate = this.FREAH_RATE_MIDDLE
    this.container = container
    this.item_arr = item_arr
}
Building.prototype.run = function () {
    initView()
    initEvent()
    animate()
}
Building.prototype.connect = function (websocektUrl, freahRate) {
    this.freahRate = freahRate
    initNet(websocektUrl)
}


// 初始化部分
// 初始化相机，场景，光源，皮肤
function initView() {
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 5000 );
    camera.position.set(0,500,2000)
    // scene
    scene = new THREE.Scene();
    var ambientLight = new THREE.AmbientLight( 0xcccccc, 0.4 );
    scene.add( ambientLight );
    var pointLight = new THREE.PointLight( 0xffffff, 0.8 );
    camera.add( pointLight );
    scene.add( camera );
    var manager = new THREE.LoadingManager( loadModel );
    manager.onProgress = function ( item, loaded, total ) {
        console.log( item, loaded, total )
    };
    var loader = new THREE.OBJLoader( manager );
    loader.load( 'models/obj/male02/test.obj', function ( obj ) {
        object = obj;
    }, onProgress, onError );
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( this.container.getBoundingClientRect().width, this.container.getBoundingClientRect().height );
    this.container.appendChild( renderer.domElement );
    // manager
    function loadModel() {
        pivotY = new THREE.Object3D();
        pivotY.position.set(0, -500, 0)
        pivotX = new THREE.Object3D();
        pivotX.position.set(0, 0, 0)
        pivotY.add(pivotX)
        // object.traverse( function ( child ) {
        //     if ( child.isMesh ) child.material.map = texture;
        // } );
        object.position.set(-1000,-500,0)
        //scene.add( object );
        pivotX.add(object);
        updateItem(pivotY)
        let helper = new THREE.GridHelper( 1500, 60, 0xff0000, 0x404040 );
        helper.position.y = 25
        pivotY.add( helper );
        scene.add( pivotY );
        pivotX.rotation.x = -1.575
        // pivotX.translateY(-6000)
    }
}
function initEvent() {
    // document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    // window.addEventListener( 'resize', onWindowResize, false );
    // document.addEventListener( 'mousemove', onMouseMove2, false );
    document.addEventListener( 'mousedown', onMouseDown, false );
    document.addEventListener( 'mouseup', onMouseup, false );
    document.addEventListener('dblclick', onDocumenDblClick);
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
}
function initNet(websocektUrl) {
    if ("WebSocket" in window) {
        console.log("您的浏览器支持 WebSocket!");
        // 打开一个 web socket
        var ws = new WebSocket(websocektUrl);
        ws.onopen = function() {
            ws.send({data: '连接成功'});
        };

        ws.onmessage = function (evt) {
            var received_msg = evt.data;
            this.item_arr = JSON.parse(received_msg)
            if(pivotY && this.freahRate > 300) {
                this.freahRate = 0
                updateItem(pivotY)
            }
        };

        ws.onclose = function() {
            console.log("连接已关闭...");
        };
    } else {
        console.log("您的浏览器不支持 WebSocket!");
    }
}
function animate() {
    requestAnimationFrame( animate );
    render();
}


// dom操作
function updateItem(pivotY) {
    // 清空之前的点
    for (let itemObj of itemObjArr) {
        pivotY.remove(itemObj)
    }
    // 画新点
    for (let item of this.item_arr) {
        let color = item.status == 1 ? 0xff0000 : 0x00ff00
        var geometry = new THREE.CylinderBufferGeometry( 10, 10, 20, 32 );
        var material = new THREE.MeshBasicMaterial( {color: color} );
        memoryArr.push(geometry)
        memoryArr.push(material)
        var cube = new THREE.Mesh( geometry, material );
        cube.position.set( item.positionX, item.positionY, item.positionZ );

        itemObjArr.push(cube)
        createWord(item)
        pivotY.add( cube );
        if (isDrawLine) {
            for (let i = 0; i<item.linePoint.length;i++) {
                let item2 = this.item_arr[item.linePoint[i]]
                if (item2) {
                    var lineImg = createLine(item, item2, 0x666666);
                    itemObjArr.push(lineImg)
                    pivotY.add( lineImg );
                } else {
                }
            }
        }
    }
}
function createLine (point1, point2, color){
    let geometry = new THREE.Geometry();

    const p1 = new THREE.Vector3(point1.positionX,point1.positionY,point1.positionZ);
    const p2 = new THREE.Vector3(point2.positionX,point2.positionY,point2.positionZ);
    const p3 = new THREE.Vector3(point1.positionX,point1.positionY,point1.positionZ);
    geometry.vertices.push(p1, p2, p3);

    //注意这里使用的是LineBasicMaterial 实线
    //https://threejs.org/docs/index.html#api/zh/materials/LineBasicMaterial
    let material = new THREE.LineBasicMaterial({
        color:color
    });
    memoryArr.push(material)
    let line = new THREE.Line(geometry,material);

    return line;
}
function createWord(item) {
    var text1 = '状态：'
    text1 += item.status == 1 ? '正常' : '失活'
    var position1 = {positionX:item.positionX, positionY:item.positionY, positionZ: item.positionZ}
    createWordItem(position1, text1)

    var text2 = '温度：33℃'
    var position2 = {positionX:item.positionX, positionY:item.positionY + 20, positionZ: item.positionZ}
    createWordItem(position2, text2)
}
function createWordItem(position, text) {
    let canvas = document.createElement('canvas');
    var img = new Image();
    canvas.width = 1800
    canvas.height = 400
    let ctx = canvas.getContext('2d')
    ctx.scale(1, -1)
    //生成图片
    img.src = "./img/talk3.png"
    img.onload = function(){
        //制作矩形
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(0, -900, 1800, 400)
        // 将图片画到canvas上面上去！
        ctx.drawImage(this,0,-400, 1800,400);
        ctx.fillStyle = "#fff";
        ctx.font = 'normal 140px "微软雅黑"'
        ctx.fillText(text, 500, 240 -400)
        let texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        // var spriteMap = new THREE.TextureLoader().load( url );
        //使用Sprite显示文字
        let material = new THREE.SpriteMaterial({map:texture, color: 0xffffff});
        memoryArr.push(material)
        let textObj = new THREE.Sprite(material);
        textObj.scale.set(100, 0.2*100, 100);
        textObj.position.set(position.positionX + 20, position.positionY+ 20, position.positionZ);
        // textObj.rotation.x = 2
        itemObjArr.push(textObj)
        pivotY.add( textObj );
    }
}


//事件函数
function onProgress( xhr ) {
    if ( xhr.lengthComputable ) {
        var percentComplete = xhr.loaded / xhr.total * 100;
        console.log( 'model ' + Math.round( percentComplete, 2 ) + '% downloaded' );
    }

}
function onError() {}
function onKeyDown(event) {
    if (event.keyCode == 32) {
        isStopSpace = !isStopSpace
        press32 = true
    }
    if (event.keyCode == 76) {
        isDrawLine = true
        updateItem(pivotY)
    }
    if (event.keyCode == 78) {
        isDrawLine = false
        updateItem(pivotY)
    }
}
function onKeyUp (event) {
    if (event.keyCode == 32) {
        press32 = false
    }
}
function onDocumenDblClick(e) {
    console.log(pivotX.position.y)
    if (pivotX.position.y < -5000) {
        pivotX.position.y = 0
    } else {
        pivotX.position.y = -6000
    }
}
function onMouseDown(event){
    isStop = true
    event.preventDefault();
    mouseDown = true;
    mouseX = event.clientX;//出发事件时的鼠标指针的水平坐标
    mouseY = event.clientY;//出发事件时的鼠标指针的水平坐标
    document.addEventListener( 'mousemove', onMouseMove2, false );
}
function onMouseup(event){
    isStop = false
    mouseDown = false;
    document.removeEventListener("mousemove", onMouseMove2);
}
function onMouseMove2(event){
    if(!mouseDown){
        return;
    }
    if (press32) {
        var deltaX2 = event.clientX - mouseX;
        var deltaY2 = event.clientY - mouseY;
        mouseX = event.clientX;
        mouseY = event.clientY;
        rotateScene2(deltaX2, deltaY2)
    } else {
        var deltaX = event.clientX - mouseX;
        var deltaY = event.clientY - mouseY;
        mouseX = event.clientX;
        mouseY = event.clientY;
        rotateScene(deltaX, deltaY);
    }
}
function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}
function onDocumentMouseMove( event ) {
    mouseX = ( event.clientX - windowHalfX ) / 2;
    mouseY = ( event.clientY - windowHalfY ) / 2;
}
function rotateScene2(deltaX, deltaY) {
    /*
           鼠标移动控制模型旋转思想：
           当按下鼠标时及时当前鼠标的水平坐标clientX1，在鼠标移动的过程中不断触发onMouseMove事件，
           不停的记录鼠标的当前坐标clientX2，由当前坐标减去记录的上一个水平坐标，
           并且将当前的坐标付给上一个坐标clientX1，计算两个坐标的之间的差clientX2-clientX1，
           将得到的差值除以一个常量（这个常量可以根据自己的需要调整），得到旋转的角度
       */
    pivotY.position.x += deltaX
    pivotY.position.y += -deltaY
}
//设置模型旋转速度，可以根据自己的需要调整
function rotateScene(deltaX, deltaY){
    //设置旋转方向和移动方向相反，所以加了个负号
    var deg = deltaX/279;
    var degX = deltaY/279;
    //deg 设置模型旋转的弧度
    // if ((pivotX.rotation.x + degX)< -1.5 || (pivotX.rotation.x + degX) > 0) {
    // 	console.log('角度限制：', pivotX.rotation.x)
    // } else {
    //
    // }
    if ((camera.position.y + deltaY * 3) > -450 && (camera.position.y + deltaY * 3) < 2000) {
        camera.position.y += deltaY * 3
        // camera.position.x += deltaX
    }
    pivotY.rotation.y += deg;
    // pivotX.rotation.x += degX;
    // camera.position.y = ( deltaY + camera.position.y ) * 0.5;
    render();
}

// 根据浏览器刷新频率定时执行刷新页面，可以做一些定时任务
function render() {
    this.freahRate++
    if (!isStop && !isStopSpace && pivotY) {
        pivotY.rotation.y += 0.005;
    }
    // camera.position.x += ( mouseX - camera.position.x ) * 1;
    // camera.position.y = ( mouseY + camera.position.y ) * 0.11;
    // console.log(pivotX.rotation)
    // console.log('camera:', camera.position)
    // console.log('scene:', scene.position)
    // scene.position.set(3000,0,0)
    camera.lookAt( scene.position );
    renderer.render( scene, camera );
}

