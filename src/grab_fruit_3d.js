window.initGame = (React, assetsUrl) => {
    const { useState, useEffect, useRef, useMemo } = React;
    const { useFrame, useLoader, useThree } = window.ReactThreeFiber;
    const THREE = window.THREE;
    const { GLTFLoader } = window.THREE;
  
    const ModelLoader = React.memo(function ModelLoader({ url, scale = [1, 1, 1], position = [0, 0, 0] }) {
      const gltf = useLoader(GLTFLoader, url);
      const copiedScene = useMemo(() => gltf.scene.clone(), [gltf]);
  
      useEffect(() => {
        copiedScene.scale.set(...scale);
        copiedScene.position.set(...position);
      }, [copiedScene, scale, position]);
  
      return React.createElement('primitive', { object: copiedScene });
    });
  
    function Apple({ position, onPickUp }) {
      return React.createElement(
        'group',
        { position: position, onClick: onPickUp },
        React.createElement(ModelLoader, {
          url: `${assetsUrl}/apple.glb`,
          scale: [0.2, 0.2, 0.2],
        })
      );
    }
  
    function Hand({ heldApple }) {
      const handRef = useRef();
      const { camera, mouse } = useThree();
  
      useFrame(() => {
        if (handRef.current) {
          const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
          vector.unproject(camera);
          const dir = vector.sub(camera.position).normalize();
          const distance = -camera.position.z / dir.z;
          const pos = camera.position.clone().add(dir.multiplyScalar(distance));
          handRef.current.position.copy(pos);
        }
      });
  
      return React.createElement(
        'group',
        { ref: handRef },
        React.createElement(ModelLoader, {
          url: `${assetsUrl}/hand.glb`,
          scale: [0.5, 0.5, 0.5],
          position: [0, 0, 0],
        }),
        heldApple && React.createElement(ModelLoader, {
          url: `${assetsUrl}/apple.glb`,
          scale: [0.2, 0.2, 0.2],
          position: [0, -0.5, 0],
        })
      );
    }
  
    function Basket({ position, onDrop }) {
      return React.createElement(
        'group',
        { position: position, onClick: onDrop },
        React.createElement(ModelLoader, {
          url: `${assetsUrl}/basket.glb`,
          scale: [2, 2, 2],
        })
      );
    }
  
    function Camera() {
      const { camera } = useThree();
      useEffect(() => {
        camera.position.set(0, 10, 15);
        camera.lookAt(0, 0, 0);
      }, [camera]);
  
      return null;
    }
  
    function AppleGame() {
      const [apples, setApples] = useState([]);
      const [heldApple, setHeldApple] = useState(null);
      const [pickedApples, setPickedApples] = useState(Array(10).fill(false));
  
      useEffect(() => {
        const generateApples = () => {
          const newApples = Array.from({ length: 10 }, () => ({
            position: [
              (Math.random() - 0.5) * 20,
              0,
              (Math.random() - 0.5) * 20,
            ],
          }));
          setApples(newApples);
        };
        generateApples();
      }, []);
  
      const handleClick = (index) => {
        if (heldApple === null) {
          setHeldApple(index);
          setPickedApples((prev) => {
            const newPicked = [...prev];
            newPicked[index] = true; // Mark the apple as picked
            return newPicked;
          });
        } else {
          setHeldApple(null);
        }
      };
  
      const dropApple = () => {
        if (heldApple !== null) {
          // Logic for dropping the apple into the basket
          setHeldApple(null);
        }
      };
  
      return React.createElement(
        React.Fragment,
        null,
        React.createElement(Camera),
        React.createElement('ambientLight', { intensity: 0.5 }),
        React.createElement('pointLight', { position: [10, 10, 10] }),
        apples.map((apple, index) =>
          !pickedApples[index] && React.createElement(Apple, {
            key: index,
            position: apple.position,
            onPickUp: () => handleClick(index),
          })
        ),
        React.createElement(Basket, {
          position: [0, 0, 0],
          onDrop: dropApple,
        }),
        React.createElement(Hand, {
          heldApple: heldApple !== null ? apples[heldApple].position : null,
        })
      );
    }
  
    return AppleGame;
  };
  
  console.log('3D Apple Collection game script loaded');
