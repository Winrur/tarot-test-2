var Main = function(){
    this.namer = new Namer();
    if(altspace.inClient){
        var _this = this;
        this.parseSettings();
        this.setupCopyPaste();
        this.setupAltspace()
            .then(function(){
                _this.setupGizmos();
                _this.setupDisplayBox();
                _this.keyboard = new Keyboard(_this);
            });
    }
};
Main.prototype = {
    current_scene_name:"",
    copy:function(value,is_cut){
        this.copied_value = value;
        this.paste.style.display = "inline-block";
        this.paste.innerText = 'Paste Object';
        this.is_cut = !!is_cut;
    },
    setupCopyPaste:function(){
        var _this = this;
        this.copied_value = "";
        document.querySelector('.paste-button').addEventListener('mousedown',function(e){
            e.preventDefault();
        });
        this.paste = document.querySelector('.paste-button')
        this.paste.style.display = 'none';
        this.paste.addEventListener('click',function(){
            _this.paste.style.display = "none";
            _this.scene_graph.clone();
        });
        document.querySelector('#precision-top').addEventListener('click',function(){
            _this.precision/=10;
            if(_this.precision<0.001){
                _this.precision = 10;
            }
            var value = document.querySelector('.precision-value')
            if(value)value.innerHTML = _this.precision;
        });
        document.querySelector('#keyboard-top').addEventListener('click',function(){
            _this.keyboard.toggle(!_this.keyboard.is_open);
        });
    },
    setupUserPanel:function(){
        var _this = this;
        this.primitive_settings = new PrimitiveSettings(this);
        this.scene_graph = new SceneGraph(this);
        //this.scene_graph.load();
        this.user_panel = new UserPanel(this);
        this.edit_button = new THREE.Object3D();
        this.edit_button.addBehaviors(new altspaceutil.behaviors.NativeComponent('n-cockpit-parent', {}, { useCollider: true }));
        this.open_panel_button = new THREE.Mesh(new THREE.PlaneGeometry(0.12,0.12),new THREE.MeshBasicMaterial({transparent:true,map:new THREE.TextureLoader().load('images/ic_mode_edit_white_48dp.png')}));
        this.edit_button.add(this.open_panel_button);
        this.fly_button_texture = new THREE.TextureLoader().load('images/wing.png');
        this.fly_button_texture.repeat.set(0.5,1);

        this.hand_track_texture = new THREE.TextureLoader().load('images/hand.png');
        this.hand_track_texture.repeat.set(0.5,1);
        this.hand_track_texture.offset.set(0.5, 0);
        this.can_fly = false;
        this.fly_button = new THREE.Mesh(new THREE.PlaneGeometry(0.12,0.12),new THREE.MeshBasicMaterial({transparent:true,map:this.fly_button_texture}));
        this.fly_button.position.x=-0.15;
        this.edit_button.add(this.fly_button);
        this.is_hand_tracking = true;
        this.hand_track_button = new THREE.Mesh(new THREE.PlaneGeometry(0.12,0.12),new THREE.MeshBasicMaterial({transparent:true,map:this.hand_track_texture}));
        this.hand_track_button.position.x=-0.3;
        this.edit_button.add(this.hand_track_button);
        this.hand_track_button.addEventListener('cursorup',function(){
            _this.is_hand_tracking = !_this.is_hand_tracking;
            if(_this.is_hand_tracking) {
                _this.hand_track_texture.offset.set(0.5, 0);
                _this.recenter_button.scale.set(0.000001,0.000001,0.000001);
            }else{
                _this.hand_track_texture.offset.set(0, 0);
                _this.recenter_button.scale.set(1,1,1);
            }
            _this.user_panel.scaleVRPanel();
        });

        this.recenter_button = new THREE.Mesh(new THREE.PlaneGeometry(0.12,0.12),new THREE.MeshBasicMaterial({transparent:true,map:new THREE.TextureLoader().load('images/recenter.png')}));
        this.recenter_button.position.x=-0.45;
        this.edit_button.add(this.recenter_button);
        this.recenter_button.addEventListener('cursorup',function(){
            _this.user_panel.showInFront();
        });
        this.recenter_button.scale.set(0.000001,0.000001,0.000001);
        this.hand_track_button.scale.set(0.000001,0.000001,0.000001);
        this.fly_current_value = new THREE.Object3D();
        this.fly_current_value.addBehaviors(new altspaceutil.behaviors.NativeComponent('n-text',{text: '-5', fontSize: 1}));
        this.fly_current_value.scale.set(0.5,0.5,0.5);
        this.fly_current_value.position.x=-0.165;
        this.fly_current_value.position.y=0.5;
        this.edit_button.add(this.fly_current_value);
        this.fly_plane = new THREE.Mesh(new THREE.PlaneGeometry(10000,10000),new THREE.MeshBasicMaterial({visible:false}));
        this.fly_plane.position.set(0,-5,0);
        this.fly_plane.rotation.set(-Math.PI/2,0,0);
        this.fly_plane.addBehaviors(new altspaceutil.behaviors.NativeComponent('n-mesh-collider',{type: 'environment', convex: false}));
        this.fly_plane.scale.set(0.000001,0.000001,0.000001);
        this.simulation.scene.add(this.fly_plane);
        this.fly_current_value.scale.set(0.000001,0.000001,0.000001);
        this.fly_button.addEventListener('cursorup',function(){
            _this.can_fly = !_this.can_fly;
            if(_this.can_fly){
                _this.fly_up_button.scale.set(1,1,1);
                _this.fly_down_button.scale.set(1,1,1);
                _this.fly_current_value.scale.set(1,1,1);
                _this.fly_button_texture.offset.set(0.5,0);
                _this.fly_plane.scale.set(1,1,1);
            }else{
                _this.fly_button_texture.offset.set(0,0);
                _this.fly_current_value.scale.set(0.000001,0.000001,0.000001);
                _this.fly_plane.scale.set(0.000001,0.000001,0.000001);
                _this.fly_up_button.scale.set(0.000001,0.000001,0.000001);
                _this.fly_down_button.scale.set(0.000001,0.000001,0.000001);
                _this.fly_plane.position.set(0,-5,0);
                _this.fly_current_value.getBehaviorByType('n-text').data.text = (-5).toFixed(2);
            }
        });
        this.fly_up_button = new THREE.Mesh(new THREE.PlaneGeometry(0.15,0.15),new THREE.MeshBasicMaterial({transparent:true,map:new THREE.TextureLoader().load('images/up_arrow.png')}));
        this.fly_up_button.position.x=-0.165;
        this.fly_up_button.position.y=0.35;
        this.edit_button.add(this.fly_up_button);
        this.is_fly_moving = false;
        this.fly_up_button.addEventListener('cursorup',function(){
            if(_this.is_fly_moving)return;
            _this.is_fly_moving = true;
            new TWEEN.Tween(_this.fly_plane.position)
                .to(new THREE.Vector3(_this.fly_plane.position.x,_this.fly_plane.position.y+1,_this.fly_plane.position.z), 500)
                .onUpdate(function(){
                    _this.fly_current_value.getBehaviorByType('n-text').data.text = _this.fly_plane.position.y.toFixed(2);
                })
                .onComplete(function(){
                    _this.fly_current_value.getBehaviorByType('n-text').data.text = _this.fly_plane.position.y.toFixed(2);
                    _this.resetGizmos();
                    _this.is_fly_moving = false;
                })
                .start();
        });
        this.fly_up_button.scale.set(0.000001,0.000001,0.000001);
        this.fly_down_button = new THREE.Mesh(new THREE.PlaneGeometry(0.15,0.15),new THREE.MeshBasicMaterial({transparent:true,map:new THREE.TextureLoader().load('images/down_arrow.png')}));
        this.fly_down_button.position.x=-0.165;
        this.fly_down_button.position.y=0.18;
        this.edit_button.add(this.fly_down_button);
        this.fly_down_button.addEventListener('cursorup',function(){
            if(_this.is_fly_moving)return;
            _this.is_fly_moving = true;
            var new_y = _this.fly_plane.position.y-1;
            if(new_y<-5)new_y=-5;
            new TWEEN.Tween(_this.fly_plane.position)
                .to(new THREE.Vector3(_this.fly_plane.position.x,new_y,_this.fly_plane.position.z), 500)
                .onUpdate(function(){
                    _this.fly_current_value.getBehaviorByType('n-text').data.text = _this.fly_plane.position.y.toFixed(2);
                })
                .onComplete(function(){
                    _this.fly_current_value.getBehaviorByType('n-text').data.text = _this.fly_plane.position.y.toFixed(2);
                    _this.resetGizmos();
                    _this.is_fly_moving = false;
                })
                .start();
        });
        this.fly_down_button.scale.set(0.000001,0.000001,0.000001);
        this.user_panel.nonVReditButton();
        this.current_gizmo_value = new THREE.Object3D();
        this.current_gizmo_value.addBehaviors(new altspaceutil.behaviors.NativeComponent('n-text', {text:'',fontSize:1}),new altspaceutil.behaviors.NativeComponent('n-billboard'));
        this.current_gizmo_value.position.y = -2;
        document.querySelector('.title-logo').addEventListener('click',function(){
            _this.user_panel.openObject(_this.scene_graph.container);
        });

        $('#modal1').modal();
        document.querySelector('.delete-object-button').addEventListener('click',function(){
            if(_this.current_delete_callback){
                _this.current_delete_callback();
            }
        });
        $('#modal2').modal();
        document.querySelector('.load-scene-button').addEventListener('click',function(){
            if(_this.current_load_callback){
                _this.current_load_callback();
            }
        });
        $('#modal3').modal();
        document.querySelector('.overwrite-scene-button').addEventListener('click',function(){
            if(_this.current_overwrite_callback){
                _this.current_overwrite_callback();
            }
        });
        $('#modal4').modal();
        document.querySelector('.save-scene-button-modal').addEventListener('click',function(){
            _this.user_panel.saveSceneConfirm(_this.current_scene_name.split("_")[0])
                .then(function(){
                    if(_this.clear_scene_callback){
                        _this.clear_scene_callback();
                    }
                });
        });
        document.querySelector('.dont-save-scene-button-modal').addEventListener('click',function(){
            if(_this.clear_scene_callback){
                _this.clear_scene_callback();
            }
        });
        $('#modal5').modal();
        document.querySelector('.delete-scene-button').addEventListener('click',function(){
            if(_this.current_delete_scene_callback){
                _this.current_delete_scene_callback();
            }
        });

        this.updateSceneName = function () {
            _this.new_scene_name = _this.namer.generateName();
            document.getElementById('primitive-type-add-scene').value = _this.new_scene_name+" Scene";
        };
        this.updateSceneName();
        document.querySelector('.reload-namor-add-scene').addEventListener('click', this.updateSceneName);
        $('#modal6').modal();
        document.querySelector('.new-scene-button').addEventListener('click',function(){
            _this.scene_graph.newScene(document.getElementById('primitive-type-add-scene').value.trim().split(' ').join('_'));
            document.querySelector('#main-container').innerHTML = '<br><br><h4 style="text-align: center">Adding New Scene...</h4>';
            setTimeout(function(){_this.reloadScene(document.getElementById('primitive-type-add-scene').value.trim().split(' ').join('_')+"_"+_this.user.userId)},250);
        });
        this.is_editor_hidden = true;
        this.simulation.scene.add(this.current_gizmo_value);

        this.precision = 1;
        var doc_restore = function(e){
            if(!_this.is_editor_hidden) {
                _this.is_editor_hidden = !_this.is_editor_hidden;
                _this.user_panel.is_updating_hand_pos = false;
                _this.user_panel.toggleHandSize();
            }
        }.bind(this);
        this.open_panel_button.addEventListener('cursordown',function(){
            _this.is_editing = !_this.is_editing;
            _this.is_editor_hidden = true;
            _this.user_panel.update(0);
            _this.user_panel.toggle();
            if(!_this.is_editing){
                if(_this.keyboard&&_this.keyboard.is_open){
                    _this.keyboard.toggle();
                }
            }
            if(_this.left_hand){
                _this.finger_button.scale.set(1,1,1);
            }else{
                _this.finger_button.scale.set(0.0001,0.0001,0.0001);
            }
            //if(_this.left_hand){
                document.getElementById('keyboard-top').style.display = 'block';
            //}
            var scale = _this.is_editing&&_this.left_hand?1:0.000001;
            _this.hand_track_button.scale.set(scale,scale,scale);
            var scale_recenter = _this.is_editing&&!_this.is_hand_tracking&&_this.left_hand?1:0.000001;
            _this.recenter_button.scale.set(scale_recenter,scale_recenter,scale_recenter);
            _this.user_panel.scaleVRPanel();
            document.querySelector('.re-open').style.display = 'none';
        });
        document.getElementById('close-editor').addEventListener('click',function(){
            _this.is_editing = false;
            _this.user_panel.update(0);
            _this.user_panel.toggle();
            if(_this.keyboard&&_this.keyboard.is_open){
                _this.keyboard.toggle();
            }
            //_this.user_panel.openObject(_this.scene_graph.container);
        });
        document.querySelector('.re-open-button').addEventListener('click',function(){
            doc_restore();
        });
        document.getElementById('hide-editor').addEventListener('click',function(e){
            _this.is_editor_hidden = !_this.is_editor_hidden;
            _this.user_panel.is_updating_hand_pos = false;
            _this.user_panel.toggleHandSize();
            _this.user_panel.showInFront();
            e.stopPropagation();
        });


        var keys = {37: 1, 38: 1, 39: 1, 40: 1};

        function preventDefault(e) {
            e = e || window.event;
            if (e.preventDefault)
                e.preventDefault();
            e.returnValue = false;
        }

        function preventDefaultForScrollKeys(e) {
            if (keys[e.keyCode]) {
                preventDefault(e);
                return false;
            }
        }

        function disableScroll(ele) {
            if (ele.addEventListener) // older FF
                ele.addEventListener('DOMMouseScroll', preventDefault, false);
            ele.onwheel = preventDefault; // modern standard
            ele.onmousewheel = preventDefault; // older browsers, IE
            ele.ontouchmove  = preventDefault; // mobile
            ele.onkeydown  = preventDefaultForScrollKeys;
        }
        disableScroll(document.getElementById('top-nav'))
        disableScroll(document.getElementById('top-second-nav'))
    },
    resetBoundingBox:function(){
        if(this.current_object&&this.current_object.name!=="Top"){
            this.current_object._bounding_box = new THREE.Box3().setFromObject(this.current_object);
            this.display_box.position.copy(this.current_object._bounding_box.getCenter());
            var scale = this.current_object._bounding_box.getSize();
            scale.x = scale.x||0.2;
            scale.y = scale.y||0.2;
            scale.z = scale.z||0.2;
            this.display_box.scale.copy(scale);
        }else{
            //console.log(this.current_object?'is top':'nothing selected');
        }
    },
    shorten:function(string,length){
        return string.length>length?string.substr(0,length)+'...':string;
    },
    updateStorageUsed:function(){
        var _lsTotal=0,_xLen,_x;
        for(_x in localStorage){
            _xLen= ((localStorage[_x].length + _x.length)* 2);
            _lsTotal+=_xLen;
        };
        var display_total = _lsTotal;
        var display_unit = "B";
        switch(true){
            case _lsTotal>1024:
                display_total = _lsTotal/1024;
                display_unit = "KB";
                break;
            case _lsTotal>1024*1024:
                display_total = _lsTotal/1024/1024;
                display_unit = "MB";
                break;
        }
        document.querySelector('.title-logo').innerHTML = 'Scene Graph <span class="smaller-font"> '+(display_total).toFixed(2) +' '+display_unit+' of 10MB used.</span>';
    },
    resetGizmos:function(){
        if(this.current_object){
            this.current_object._bounding_box = this.current_object._bounding_box||new THREE.Box3().setFromObject(this.current_object);
            var gizmo_position = this.current_object._bounding_box.max.clone();
            if(!isFinite(gizmo_position.x)){
                gizmo_position.x = this.current_object.position.x;
            }
            if(!isFinite(gizmo_position.y)){
                gizmo_position.y = this.current_object.position.y;
            }
            if(!isFinite(gizmo_position.z)){
                gizmo_position.z = this.current_object.position.z;
            }
            gizmo_position.x+=0.1;
            gizmo_position.z+=0.1;
            gizmo_position.y=this.eye?this.eye.position.y-0.75:0.75;
            this.setGizmoPosition(this.position_gizmo,gizmo_position);
            this.setGizmoPosition(this.rotation_gizmo,gizmo_position);
            this.setGizmoPosition(this.scale_gizmo,gizmo_position);
            gizmo_position.y=this.eye?this.eye.position.y-0.5:1;
            gizmo_position.z+=0.05;
            gizmo_position.x-=0.5;
            this.gizmo_buttons.position.copy(gizmo_position);
            // this.current_gizmo_value.position.copy(this.current_object._bounding_box.getCenter());
            // this.current_gizmo_value.position.y+=((this.current_object._bounding_box.getSize().y||0.1)/2)+0.5;
            this.current_gizmo_value.scale.set(0.000001,0.000001,0.000001);
        }
        this.gizmo_buttons.scale.set(1,1,1);
    },
    showEditContainer:function(object){
        //if(object.userData&&object.userData.plusspace&&object.userData.plusspace.altspace.behaviours.filter(function(d){return d.name.indexOf('Attach')>-1;}).length)return;

        //this.current_object = object;
        this.resetGizmos();
        this.display_box.position.copy(this.current_object._bounding_box.getCenter());
        var scale = this.current_object._bounding_box.getSize();
        scale.x = scale.x||0.1;
        scale.y = scale.y||0.1;
        scale.z = scale.z||0.1;
        // this.logWholeScene();
        new TWEEN.Tween(this.display_box.scale).to(scale, 350).easing(TWEEN.Easing.Exponential.Out).start();

        this.current_gizmo_value.getBehaviorByType('n-text').data.text = 'position\nX'+
            (Math.round(this.current_object.userData.plusspace.object.transform.position.x*1000)/1000).toFixed(3)+'  Y'+
            (Math.round(this.current_object.userData.plusspace.object.transform.position.y*1000)/1000).toFixed(3)+'  Z'+
            (Math.round(this.current_object.userData.plusspace.object.transform.position.z*1000)/1000).toFixed(3);
        switch(this.current_gizmo){
            case "position":
                this.showGizmo(this.position_gizmo);
                break;
            case "rotation":
                this.showGizmo(this.rotation_gizmo);
                break;
            case "scale":
                this.showGizmo(this.scale_gizmo);
                break;
        }
    },
    matrixFromEuler:function(euler){
        return new THREE.Matrix4().makeRotationFromEuler(euler)
    },
    getRotation:function(euler){
        var current_matrix = this.matrixFromEuler( new THREE.Euler(this.current_object.userData.plusspace.object.transform.rotation.x,this.current_object.userData.plusspace.object.transform.rotation.y,this.current_object.userData.plusspace.object.transform.rotation.z))
        return new THREE.Euler().setFromRotationMatrix(current_matrix.premultiply(this.matrixFromEuler(euler.clone())));
    },
    applyRotation:function(euler,skip_update){
        var new_rotation = this.getRotation(euler)
        this.current_object.userData.plusspace.object.transform.rotation.x = new_rotation.x;
        this.current_object.userData.plusspace.object.transform.rotation.y = new_rotation.y;
        this.current_object.userData.plusspace.object.transform.rotation.z = new_rotation.z;
        if(this.current_object._transform_update&&!skip_update)this.current_object._transform_update();
        this.current_object.userData.plusspace.object.object_is_transform_updated = true;
        this.current_object.rotation.set(this.current_object.userData.plusspace.object.transform.rotation.x,this.current_object.userData.plusspace.object.transform.rotation.y,this.current_object.userData.plusspace.object.transform.rotation.z)
        if(this.current_object.userData.plusspace.object.baked_lighting)this.scene_graph.lighting.bakeVertexLighting(this.current_object,this.scene_graph.light);
    },
    hideEditContainer:function(){
        if(this.gizmo_buttons){
            this.gizmo_buttons.scale.set(0.00001,0.00001,0.00001);
        }
        if(this.current_gizmo_value){
            this.current_gizmo_value.position.y = -2;
        }
        if(this.display_box){
            new TWEEN.Tween(this.display_box.scale).to({x:0.00001,y:0.00001,z:0.00001}, 750).easing(TWEEN.Easing.Exponential.Out).start();
            switch(this.current_gizmo){
                case "position":
                    this.hideGizmo(this.position_gizmo);
                    break;
                case "rotation":
                    this.hideGizmo(this.rotation_gizmo);
                    break;
                case "scale":
                    this.hideGizmo(this.scale_gizmo);
                    break;
            }
            this.current_gizmo = "position";
        }
    },
    setupDisplayBox:function(){
        this.display_box = new THREE.Object3D();
        var display_box = new THREE.Mesh(new THREE.BoxBufferGeometry(1,1,1),new THREE.MeshBasicMaterial({transparent:true,opacity:0.05,side:THREE.BackSide, map:new THREE.TextureLoader().load('images/display_texture.png')}));
        this.display_box.add(display_box);
        display_box.userData = { altspace: { collider: { enabled: false } } };
        var fbl = this.displayBoxCorner([0.05,0.05,0.05],new THREE.Vector3(-0.5,-0.5,-0.5));
        this.display_box.add(fbl);
        var fbr = this.displayBoxCorner([0.05,-0.05,0.05],new THREE.Vector3(-0.5,-0.5,0.5));
        this.display_box.add(fbr);

        var ftl = this.displayBoxCorner([-0.05,0.05,0.05],new THREE.Vector3(-0.5,0.5,-0.5));
        this.display_box.add(ftl);
        var ftr = this.displayBoxCorner([-0.05,-0.05,0.05],new THREE.Vector3(-0.5,0.5,0.5));
        this.display_box.add(ftr);

        var btr = this.displayBoxCorner([-0.05,-0.05,-0.05],new THREE.Vector3(0.5,0.5,0.5));
        this.display_box.add(btr);
        var bbr = this.displayBoxCorner([0.05,-0.05,-0.05],new THREE.Vector3(0.5,-0.5,0.5));
        this.display_box.add(bbr);

        var btl = this.displayBoxCorner([-0.05,0.05,-0.05],new THREE.Vector3(0.5,0.5,-0.5));
        this.display_box.add(btl);

        var bbl = this.displayBoxCorner([0.05,0.05,-0.05],new THREE.Vector3(0.5,-0.5,-0.5));
        this.display_box.add(bbl);

        this.display_box.scale.set(0.00001,0.00001,0.00001);
        this.simulation.scene.add(this.display_box);
    },
    getPointInBetweenByPerc:function(pointA, pointB, percentage) {
        var dir = pointB.clone().sub(pointA).normalize().multiplyScalar(pointA.distanceTo(pointB)*(percentage||0.5));
        return pointA.clone().add(dir);
    },
    displayBoxCorner:function(offsets,position){
        var corner = new THREE.Object3D();
        corner.add(new THREE.Mesh(new THREE.BoxBufferGeometry(0.005,0.1,0.005),new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load('images/display_texture.png')})));
        corner.add(new THREE.Mesh(new THREE.BoxBufferGeometry(0.005,0.005,0.1),new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load('images/display_texture.png')})));
        corner.add(new THREE.Mesh(new THREE.BoxBufferGeometry(0.1,0.005,0.005),new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load('images/display_texture.png')})));
        corner.children[0].position.y=offsets[0];
        corner.children[1].position.z=offsets[1];
        corner.children[2].position.x=offsets[2];
        corner.position.copy(position);
        return corner;
    },
    gizmoButton:function(image){
        return new THREE.Mesh(new THREE.PlaneGeometry(0.2,0.2),new THREE.MeshBasicMaterial({transparent:true,map:new THREE.TextureLoader().load('images/'+image+'.png')}))
    },
    setupGizmos:function(){
        var _this = this;
        this.current_gizmo = "position";
        this.position_gizmo = new PositionGizmo(this);
        this.rotation_gizmo = new RotationGizmo(this);
        this.scale_gizmo = new ScaleGizmo(this);
        this.grab_gizmo = new GrabVRGizmo(this);
        var position_button = this.gizmoButton('ic_open_with_white_48dp');
        var rotation_button = this.gizmoButton('ic_rotate_90_degrees_ccw_white_48dp');//new THREE.Mesh(new THREE.PlaneGeometry(0.2,0.2),new THREE.MeshBasicMaterial({transparent:true,map:new THREE.TextureLoader().load('images/ic_rotate_90_degrees_ccw_white_48dp.png')}));
        var scale_button = this.gizmoButton('ic_border_outer_white_48dp');//new THREE.Mesh(new THREE.PlaneGeometry(0.2,0.2),new THREE.MeshBasicMaterial({transparent:true,map:new THREE.TextureLoader().load('images/ic_border_outer_white_48dp.png')}));
        var finger_texture = new THREE.TextureLoader().load('images/hand_symbol.png');
        finger_texture.repeat.set(0.5,1);
        this.finger_button = new THREE.Mesh(new THREE.PlaneGeometry(0.2,0.2),new THREE.MeshBasicMaterial({transparent:true,map:finger_texture}));

        var finger_position = this.gizmoButton('ic_open_with_white_48dp');
        var finger_rotation = this.gizmoButton('ic_rotate_90_degrees_ccw_white_48dp');
        var finger_scale = this.gizmoButton('ic_border_outer_white_48dp');
        finger_position.material.opacity = 0.5;
        finger_rotation.material.opacity = 0.5;
        finger_scale.material.opacity = 0.5;
        finger_position.scale.set(0.0001,0.0001,0.0001);
        finger_rotation.scale.set(0.0001,0.0001,0.0001);
        finger_scale.scale.set(0.0001,0.0001,0.0001);
        this.finger_button.scale.set(0.0001,0.0001,0.0001);
        finger_position.addEventListener('cursordown',function(){
            _this.finger_button.userData.position_on = !_this.finger_button.userData.position_on;
            finger_position.material.opacity = _this.finger_button.userData.position_on?1:0.5;
        });
        finger_rotation.addEventListener('cursordown',function(){
            _this.finger_button.userData.rotation_on = !_this.finger_button.userData.rotation_on;
            finger_rotation.material.opacity = _this.finger_button.userData.rotation_on?1:0.5;
        });
        finger_scale.addEventListener('cursordown',function(){
            _this.finger_button.userData.scale_on = !_this.finger_button.userData.scale_on;
            finger_scale.material.opacity = _this.finger_button.userData.scale_on?1:0.5;
            finger_texture.offset.set(_this.finger_button.userData.scale_on?0.5:0,0);
        });
        var position_click = function(){
            if(_this.current_gizmo!=="position"){
                position_button.scale.set(1,1,1);
                rotation_button.scale.set(1,1,1);
                scale_button.scale.set(1,1,1);
                finger_position.scale.set(0.0001,0.0001,0.0001);
                finger_rotation.scale.set(0.0001,0.0001,0.0001);
                finger_scale.scale.set(0.0001,0.0001,0.0001);
                _this.hideGizmo(_this[_this.current_gizmo+"_gizmo"])
                    .then(function(){
                        _this.current_gizmo = "position";
                        _this.current_gizmo_value.getBehaviorByType('n-text').data.text = 'position\nX'+
                            (Math.round(_this.current_object.userData.plusspace.object.transform.position.x*1000)/1000).toFixed(3)+'  Y'+
                            (Math.round(_this.current_object.userData.plusspace.object.transform.position.y*1000)/1000).toFixed(3)+'  Z'+
                            (Math.round(_this.current_object.userData.plusspace.object.transform.position.z*1000)/1000).toFixed(3);
                    })
                    .then(function(){
                        return _this.showGizmo(_this.position_gizmo);
                    })
            }
        };
        position_button.addEventListener('cursordown',position_click.bind(_this));
        rotation_button.addEventListener('cursordown',function(){
            console.log(_this.current_gizmo+"_gizmo");
            if(_this.current_gizmo!=="rotation"){
                position_button.scale.set(1,1,1);
                rotation_button.scale.set(1,1,1);
                scale_button.scale.set(1,1,1);
                finger_position.scale.set(0.0001,0.0001,0.0001);
                finger_rotation.scale.set(0.0001,0.0001,0.0001);
                finger_scale.scale.set(0.0001,0.0001,0.0001);
                _this.hideGizmo(_this[_this.current_gizmo+"_gizmo"])
                    .then(function(){
                        _this.current_gizmo = "rotation";
                        _this.current_gizmo_value.getBehaviorByType('n-text').data.text = 'rotation\nX'+
                            (Math.round((_this.current_object.userData.plusspace.object.transform.rotation.x*180/Math.PI)*10)/10).toFixed(3)+'  Y'+
                            (Math.round((_this.current_object.userData.plusspace.object.transform.rotation.y*180/Math.PI)*10)/10).toFixed(3)+'  Z'+
                            (Math.round((_this.current_object.userData.plusspace.object.transform.rotation.z*180/Math.PI)*10)/10).toFixed(3);
                    })
                    .then(function(){
                        return _this.showGizmo(_this.rotation_gizmo);
                    })
            }
        });
        scale_button.addEventListener('cursordown',function(){
            console.log(_this.current_gizmo+"_gizmo");
            if(_this.current_gizmo!=="scale"){
                position_button.scale.set(1,1,1);
                rotation_button.scale.set(1,1,1);
                scale_button.scale.set(1,1,1);
                finger_position.scale.set(0.0001,0.0001,0.0001);
                finger_rotation.scale.set(0.0001,0.0001,0.0001);
                finger_scale.scale.set(0.0001,0.0001,0.0001);
                _this.hideGizmo(_this[_this.current_gizmo+"_gizmo"])
                    .then(function(){
                        _this.current_gizmo = "scale";
                        _this.current_gizmo_value.getBehaviorByType('n-text').data.text = 'scale\nX'+
                            (Math.round(_this.current_object.userData.plusspace.object.transform.scale.x*1000)/1000).toFixed(3)+'  Y'+
                            (Math.round(_this.current_object.userData.plusspace.object.transform.scale.y*1000)/1000).toFixed(3)+'  Z'+
                            (Math.round(_this.current_object.userData.plusspace.object.transform.scale.z*1000)/1000).toFixed(3);
                    })
                    .then(function(){
                        return _this.showGizmo(_this.scale_gizmo);
                    })
            }
        });
        this.finger_button.addEventListener('cursordown',function(){
            if(_this.current_gizmo!=="grab"){
                _this.hideGizmo(_this[_this.current_gizmo+"_gizmo"])
                _this.current_gizmo = "grab";
                position_button.scale.set(0.0001,0.0001,0.0001);
                rotation_button.scale.set(0.0001,0.0001,0.0001);
                scale_button.scale.set(0.0001,0.0001,0.0001);
                finger_position.scale.set(1,1,1);
                finger_rotation.scale.set(1,1,1);
                finger_scale.scale.set(1,1,1);
            }else{
                _this.finger_button.userData.scale_on = false;
                finger_scale.material.opacity = 0.5;
                _this.finger_button.userData.position_on = false;
                finger_position.material.opacity = 0.5;
                _this.finger_button.userData.rotation_on = false;
                finger_rotation.material.opacity = 0.5;
                finger_texture.offset.set(0,0);
                position_click();
            }
        });
        finger_position.position.x=position_button.position.x=-0.2;
        finger_scale.position.x=scale_button.position.x=0.2;
        this.finger_button.position.x=0.2;
        this.finger_button.position.y=0.2;
        this.gizmo_buttons = new THREE.Object3D();
        this.gizmo_buttons.add(position_button);
        this.gizmo_buttons.add(rotation_button);
        this.gizmo_buttons.add(scale_button);
        this.gizmo_buttons.add(finger_position);
        this.gizmo_buttons.add(finger_scale);
        this.gizmo_buttons.add(finger_rotation);
        this.gizmo_buttons.add(this.finger_button);
        this.gizmo_buttons.scale.set(0.00001,0.00001,0.00001);
        this.simulation.scene.add(this.gizmo_buttons);
    },
    setupFirgerTrackers:function(){
        this._left_finger_input = new THREE.Object3D();
        this.left_finger_input = new THREE.Object3D();//new THREE.Mesh(new THREE.SphereGeometry(0.01,24,24),new THREE.MeshBasicMaterial({color:'#ff0000',map:new THREE.TextureLoader().load('images/display_texture.png')}));
        this.left_finger_input.position.set(-0.033,0,0.175);
        this._left_finger_input.add(this.left_finger_input);
        this._right_finger_input = new THREE.Object3D();
        this.right_finger_input = new THREE.Object3D();//new THREE.Mesh(new THREE.SphereGeometry(0.01,24,24),new THREE.MeshBasicMaterial({color:'#ff0000',map:new THREE.TextureLoader().load('images/display_texture.png')}));
        this.right_finger_input.position.set(0.033,0,0.175);
        this._right_finger_input.add(this.right_finger_input);
        this.simulation.scene.add(this._right_finger_input);
        this.simulation.scene.add(this._left_finger_input);
    },
    setupAltspace:function(){
        var _this=this;
        this.simulation = new altspace.utilities.Simulation();
        this.setupFirgerTrackers();
        var updateBehavior = function(){};
        updateBehavior.prototype.update = function(){
            TWEEN.update();
            if(_this.scale_gizmo)_this.scale_gizmo.update();
            if(_this.rotation_gizmo)_this.rotation_gizmo.update();
            if(_this.position_gizmo)_this.position_gizmo.update();
            if(_this.grab_gizmo)_this.grab_gizmo.update();
            if(_this.keyboard)_this.keyboard.update();
            var gamepadsList = altspace.getGamepads();
            for (var i = 0; i < gamepadsList.length; i++) {
                var curPadInfo = gamepadsList[i];
                switch (curPadInfo.mapping) {
                    case "standard":
                        continue;
                    case "touch":
                    case "steamvr":
                        this.mapping = curPadInfo.mapping;
                        if (curPadInfo.hand == "left") {
                            _this.padL = curPadInfo;
                        } else {
                            _this.padR = curPadInfo;
                        }
                        break;
                    default:
                        console.log("UNKNOWN CONTROLLER TYPE??", curPadInfo.mapping);
                        break;
                }
            }
            _this.gamepad_controls = !!_this.padL&&!!_this.padR;
            _this.getTrackingSkeleton()
                .then(function(){
                    var rotation_has_changed = false;
                    var hand_rotation_has_changed = false;
                    var pos_threshold = 0.0001;
                    var rot_threshold = 0.0001;
                    _this.skeleton.children.forEach(function(d){
                        if(d.location==="CenterHead0"){
                            _this.head = {position:{x:d.position.x,y:d.position.y,z:d.position.z},rotation:{x:d.rotation.x,y:d.rotation.y,z:d.rotation.z}}
                        }else if(d.location==="CenterEye0"){
                            // if(!rotation_has_changed&&_this.eye)rotation_has_changed = _this.eye.position.x!==d.position.x
                            //     ||_this.eye.position.y!==d.position.y
                            //     ||_this.eye.position.z!==d.position.z
                            //     ||_this.eye.rotation.x!==d.rotation.x
                            //     ||_this.eye.rotation.y!==d.rotation.y
                            //     ||_this.eye.rotation.z!==d.rotation.z;
                            _this.eye = {position:{x:d.position.x,y:d.position.y,z:d.position.z},rotation:{x:d.rotation.x,y:d.rotation.y,z:d.rotation.z}}
                        }else if(d.location==="LeftHand0"){
                            hand_rotation_has_changed = true;
                            _this._left_finger_input.position.copy(d.position);
                            _this._left_finger_input.rotation.copy(d.rotation);
                            _this.left_hand = {position:{x:d.position.x,y:d.position.y,z:d.position.z},rotation:{x:d.rotation.x,y:d.rotation.y,z:d.rotation.z}}
                        }else if(d.location==="RightHand0"){
                            _this._right_finger_input.position.copy(d.position);
                            _this._right_finger_input.rotation.copy(d.rotation);
                            _this.right_hand = {position:{x:d.position.x,y:d.position.y,z:d.position.z},rotation:{x:d.rotation.x,y:d.rotation.y,z:d.rotation.z}}
                        }
                    });
                    // if((!_this.left_hand&&rotation_has_changed)||(_this.left_hand&&hand_rotation_has_changed)){
                    //     console.log('has_changed');
                    //
                    // }

                    if(_this.user_panel)_this.user_panel.update();
                });
        };
        this.simulation.scene.addBehaviors(new updateBehavior());

        return this.getDocument()
            .then(function(){return _this.getUser()})
            .then(function(){return _this.getSpace()})
            .then(function(){return _this.getEnclosure()});
    },
    getUser:function(){
        var _this=this;
        return altspace.getUser()
            .then(function(user){
                _this.user = user;
            });
    },
    getDocument:function(){
        var _this=this;
        return altspace.getDocument()
            .then(function(document){
                document.scale.set(0.000001,0.000001,0.000001);
                document.inputEnabled = true;
                _this.document = document;
                _this.setupUserPanel();
            });
    },
    resetObjectChanges:function(scene_parent){
        var _this = this;
        scene_parent = scene_parent||this.scene_graph.container;
        if(scene_parent.userData.plusspace){
            scene_parent.userData.plusspace.object.object_is_removed = false;
            scene_parent.userData.plusspace.object.object_is_added = false;
            scene_parent.userData.plusspace.object.object_is_updated = false;
            scene_parent.userData.plusspace.object.object_is_transform_updated = false;
            if(scene_parent.children&&scene_parent.children.length){
                scene_parent.children.forEach(function(child){
                    _this.resetObjectChanges(child);
                });
            }
        }
    },
    getObjectChanges:function(scene_parent, synced_objects){
        var _this = this;
        scene_parent.children.forEach(function(child){
            if(child.userData.plusspace&&child.userData.plusspace.object.object_is_removed){
                synced_objects.push({settings:{object:{object_is_removed:true,uuid:child.userData.plusspace.object.uuid}}});
                _this.scene_graph.removeItem(child);
            }else{
                if(child.userData.plusspace&&(child.userData.plusspace.object.object_is_updated||child.userData.plusspace.object.object_is_transform_updated||child.userData.plusspace.object.object_is_added)){
                    var settings = {settings:child.userData.plusspace};
                    if(child.userData.plusspace.object.object_is_added||child.userData.plusspace.object.object_is_updated)settings.parent_uuid = (child.parent||_this.scene_graph.container).userData.plusspace.object.uuid;
                    if(child.userData.plusspace.object.object_is_transform_updated){
                        synced_objects.push({
                                settings:{
                                    object:{
                                        uuid:child.userData.plusspace.object.uuid,
                                        transform:child.userData.plusspace.object.transform,
                                        object_is_transform_updated:true
                                    }
                                }
                            });
                    }else{
                        synced_objects.push(settings);
                    }
                }
                if(child.userData.plusspace&&child.children&&child.children.length&&child.userData.plusspace.object.type!=="Poly"){
                    _this.getObjectChanges(child, synced_objects);
                }
            }
        });
    },
    syncChanges:function(){
        var _this = this;
        var scene_changes = [];
        _this.getObjectChanges(_this.scene_graph.container,scene_changes);
        _this.socket.emit('scene-sync',{sid:_this.space.sid,userData:_this.user,spaceData:_this.space,sceneData:scene_changes});
        _this.resetObjectChanges();
    },
    setupSocket:function(){
        var _this=this;
        if(_this.user.userId === "438397537657815117"||_this.user.userId === "753637294488944722"){
            _this.user.isModerator = true;
        }
        setTimeout(function(){
            _this.socket.emit('is-moderator',{sid:_this.space.sid,userData:_this.user,spaceData:_this.space});
        },50);
        this.socket.on('load-scene',function(msg){
            if(msg){
                _this.current_scene_name = msg;
                _this.scene_graph.loadRemoteScene(msg)
                    .then(function(){
                        document.getElementById('close-scene').style.display = 'block';
                        document.getElementById('save-scene').style.display = 'block';
                        document.getElementById('current-users').style.display = 'block';
                        document.getElementById('reload-page').style.display = 'block';
                        document.getElementById('precision-top').style.display = 'block';
                        _this.user_panel.openObject(_this.scene_graph.container);
                    });

            }
        });
        this.socket.on('is-moderator',function(){
            _this.user.isModerator = true;
            _this.simulation.scene.add(_this.edit_button);
        });
        this.socket.on('is-not-moderator',function(){
            _this.user.isModerator = false;
            _this.simulation.scene.remove(_this.edit_button);
            if(_this.is_editing){
                _this.user_panel.toggle();
            }
        });
        this.socket.on('scene-sync',function(msg){
            _this.scene_graph.syncChanges(_this.scene_graph.container,msg);
            //_this.user_panel.openObject(_this.scene_graph.container);
        });
        this.socket.on('current-users',function(msg){
            _this.user_panel.currentUsers(msg);
        });
    },
    currentUsers:function(){
        if(this.socket){
            this.socket.emit('current-users',{sid:this.space.sid,userData:this.user,spaceData:this.space});
        }
    },
    elevateUser:function(user){
        if(this.socket){
            this.socket.emit('elevate',{sid:this.space.sid,userData:this.user,spaceData:this.space,elevateData:user});
        }
    },
    reloadScene:function(name){
        var settings = {sid:this.space.sid,userData:this.user,spaceData:this.space};
        if(name){
            settings.currentScene = name;
        }
        this.socket.emit('scene-change',settings);
    },
    removeScene:function(scene){
        this.scene_graph.currentSceneList = this.scene_graph.currentSceneList.filter(function(_scene){return _scene.name !==scene.name});
        this.user_panel.saveCurrentSceneList();
    },
    getSpace:function(){
        var _this=this;
        return altspace.getSpace()
            .then(function(space){
                _this.space = space;
                console.log(space);
                _this.scene_graph.loadRemoteConfig('scene-list')
                    .then(function(config){
                        try{
                            _this.scene_graph.currentSceneList = JSON.parse(config);
                        }catch(e){
                            _this.scene_graph.currentSceneList = [];
                        }
                        var promise = Promise.resolve();
                        if(!_this.scene_graph.currentSceneList.length){
                            _this.scene_graph.resetScene();
                            promise = _this.user_panel.saveSceneConfirm('My-First');
                        }

                        promise.then(function(){
                            _this.socket = io();
                            _this.setupSocket();
                            var init_settings = {sid:_this.space.sid,userData:_this.user,spaceData:_this.space};
                            _this.socket.emit('init',init_settings);
                            _this.user_panel.openSceneList();



                            // if(_this.current_scene_name){
                            //     init_settings.currentScene = _this.current_scene_name;
                            // }else if(_this.scene_graph.currentSceneList.length){
                            //     init_settings.currentScene = _this.scene_graph.currentSceneList[0].name+"_"+_this.user.userId;
                            // }
                            // if(init_settings.currentScene){
                            //     _this.current_scene_name = init_settings.currentScene;
                            //     _this.scene_graph.loadRemoteScene(_this.scene_graph.currentSceneList[0].name+"_"+_this.user.userId)
                            //         .then(function(){
                            //             _this.user_panel.openObject(_this.scene_graph.container);
                            //             _this.socket.emit('init',init_settings);
                            //         })
                            //         .catch(function(error){
                            //             console.log(error);
                            //             delete _this.current_scene_name;
                            //             delete init_settings.currentScene;
                            //             _this.socket.emit('init',init_settings);
                            //         });
                            // }else{
                            //     _this.socket.emit('init',init_settings);
                            // }
                        });
                    });
                _this.scene_graph.loadRemoteConfig('behaviour-list')
                    .then(function(config){
                        try{
                            _this.scene_graph.currentBehaviourList = JSON.parse(config);
                        }catch(e){
                            _this.scene_graph.currentBehaviourList = [];
                        }
                    });
                _this.user_panel.openObject(_this.scene_graph.container);
                _this.resizeMain();
                _this.setScale();
            });
    },
    setScale:function(){
        if(this.space.templateSid.indexOf('nbcmach')>-1){
            this.user_panel.panel_scale = 2.7;
        }else if(this.space.templateSid.indexOf('highrise')>-1){
            this.user_panel.panel_scale = 1.3;
        }else if(this.space.templateSid.indexOf('playground')>-1){
            this.user_panel.panel_scale = 0.05;
        }else if(this.space.templateSid.indexOf('conference')>-1){
            this.user_panel.panel_scale = 5;
        }else if (this.space.templateSid.indexOf('exhibition')>-1){
            this.user_panel.panel_scale = 1.3;
        }else if (this.space.templateSid.indexOf('lodge')>-1){
            this.user_panel.panel_scale = 1.3;
        }else if (this.space.templateSid.indexOf('parlor')>-1){
            this.user_panel.panel_scale = 1.3;
        }else if (this.space.templateSid.indexOf('campfire')>-1){
            this.user_panel.panel_scale = 1.3;
        }
    },
    getEnclosure:function(){
        var _this=this;
        return altspace.getEnclosure()
            .then(function(enclosure){
                _this.enclosure = enclosure;
                _this.enclosure.requestFullspace().then(function(){
                    _this.simulation.scene.scale.set(enclosure.pixelsPerMeter,enclosure.pixelsPerMeter,enclosure.pixelsPerMeter);
                });
            });
    },
    getTrackingSkeleton:function(){
        var _this=this;
        return altspace.getThreeJSTrackingSkeleton()
            .then(function(skeleton){_this.skeleton = skeleton});
    },
    setGizmoPosition:function(gizmo,position){
        gizmo.container.position.copy(position);
    },
    showGizmo:function(gizmo){
        return new Promise(function(resolve){
            new TWEEN.Tween(gizmo.container.scale).to({x:1,y:1,z:1}, 350).easing(TWEEN.Easing.Exponential.Out).onComplete(function(){
                resolve();
            }).start();
        });
    },
    hideGizmo:function(gizmo){
        if(gizmo===this.grab_gizmo)return Promise.resolve();
        return new Promise(function(resolve){
            new TWEEN.Tween(gizmo.container.scale).to({x:0.00001,y:0.00001,z:0.00001}, 250).easing(TWEEN.Easing.Exponential.Out).onComplete(function(){
                resolve();
            }).start();
        });
    },
    resizeMain:function(){
        if(this.space.templateSid.indexOf('highrise')>-1||this.space.templateSid.indexOf('lodge')>-1||this.space.templateSid.indexOf('parlor')>-1){
            document.getElementById('main-container').style.height = '692px';
        }else if(this.space.templateSid.indexOf('nbcmach')>-1){
            document.getElementById('main-container').style.height = '750px';
        }
    },
    parseSettings:function(){
        var reset_scene = this.getParameterByName('reset');
        if(reset_scene==="true"){
            this.scene_graph.resetScene();
        }
        var force_2d = this.getParameterByName('force_2d');
        if(force_2d==="true"){
            this.force_2d = true;
        }
        var scene = this.getParameterByName('scene');
        if(scene){
            this.current_scene_name = scene;
        }
    },
    getParameterByName:function(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    },
};
document.addEventListener("DOMContentLoaded", function() {
    var main = new Main();
});