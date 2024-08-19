window.initGame = (React, assetsUrl) => {
  const { useState, useEffect, useRef, Suspense, useMemo } = React;
  const { useFrame, useLoader, useThree } = window.ReactThreeFiber;
  const THREE = window.THREE;
  const { GLTFLoader } = window.THREE;

  const AppleModel = React.memo(function AppleModel({ url, scale = [1, 1, 1], position = [0, 0, 0] }) {
    const gltf = useLoader(GLTFLoader, url);
    const copiedScene = useMemo(() => gltf.scene.clone(), [gltf]);
    
    useEffect(() => {
      copiedScene.scale.set(...scale);
      copiedScene.position.set(...position);
    }, [copiedScene, scale, position]);

    return React.createElement('primitive', { object: copiedScene });
  });

  function Apple({ position, isActive, onGrab }) {
    const appleRef = useRef();
    const [appleY, setAppleY] = useState(-1);

    useFrame((state, delta) => {
      if (appleRef.current) {
        const targetY = isActive ? 0 : -1;
        setAppleY(current => THREE.MathUtils.lerp(current, targetY, delta * 5));
        appleRef.current.position.y = appleY;
      }
    });

    return React.createElement(
      'group',
      { 
        ref: appleRef,
        position: position,
        onClick: onGrab
      },
      React.createElement(AppleModel, { 
        url: `${assetsUrl}/apple.glb`,
        scale: [0.5, 0.5, 0.5],
        position: [0, -0.5, 0]
      })
    );
  }

  const HandModel = React.memo(function HandModel({ url, scale = [1, 1, 1], position = [0, 0, 0], rotation = [0, 0, 0] }) {
    const gltf = useLoader(GLTFLoader, url);
    const copiedScene = useMemo(() => gltf.scene.clone(), [gltf]);
    
    useEffect(() => {
      copiedScene.scale.set(...scale);
      copiedScene.position.set(...position);
      copiedScene.rotation.set(...rotation);
    }, [copiedScene, scale, position, rotation]);

    return React.createElement('primitive', { object: copiedScene });
  });

  function Hand() {
    const handRef = useRef();
    const { camera, mouse } = useThree();
    const [isGrabbing, setIsGrabbing] = useState(false);
    const grabStartTime = useRef(0);
    const grabbedAppleIndex = useRef(null);

    useFrame((state, delta) => {
      if (handRef.current) {
        const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
        vector.unproject(camera);
        const dir = vector.sub(camera.position).normalize();
        const distance = -camera.position.z / dir.z;
        const pos = camera.position.clone().add(dir.multiplyScalar(distance));
        handRef.current.position.copy(pos);

        // Grabbing animation
        if (isGrabbing) {
          const elapsedTime = state.clock.getElapsedTime() - grabStartTime.current;
          if (elapsedTime < 0.2) {
            handRef.current.rotation.x = Math.PI / 2 * Math.sin(elapsedTime * Math.PI / 0.2);
          } else {
            setIsGrabbing(false);
            handRef.current.rotation.x = 0;
            grabbedAppleIndex.current = null;
          }
        }
      }
    });

    const handleClick = () => {
      if (isGrabbing) {
        setIsGrabbing(true);
        grabStartTime.current = THREE.MathUtils.clamp(THREE.MathUtils.randFloat(0, 1), 0, 1);
      } else {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children);
        if (intersects.length > 0) {
          const intersectedObject = intersects[0].object;
          if (intersectedObject.parent && intersectedObject.parent.userData.isApple) {
            setIsGrabbing(true);
            grabStartTime.current = THREE.MathUtils.clamp(THREE.MathUtils.randFloat(0, 1), 0, 1);
            grabbedAppleIndex.current = intersectedObject.parent.userData.appleIndex;
          }
        }
      }
    };

    return React.createElement(
      'group',
      { ref: handRef, onClick: handleClick },
      React.createElement(HandModel, { 
        url: `${assetsUrl}/hand.glb`,
        scale: [0.5, 0.5, 0.5],
        position: [0, 0, -2],
        rotation: [-Math.PI / 2, 0, 0]
      })
    );
  }

  const BasketModel = React.memo(function BasketModel({ url, scale = [1, 1, 1], position = [0, 0, 0], rotation = [0, 0, 0] }) {
    const gltf = useLoader(GLTFLoader, url);
    const copiedScene = useMemo(() => gltf.scene.clone(), [gltf]);
    
    useEffect(() => {
      copiedScene.scale.set(...scale);
      copiedScene.position.set(...position);
      copiedScene.rotation.set(...rotation);
    }, [copiedScene, scale, position, rotation]);

    return React.createElement('primitive', { object: copiedScene });
  });

  function Basket() {
    return React.createElement(
      'group',
      null,
      React.createElement(BasketModel, { 
        url: `${assetsUrl}/basket.glb`,
        scale: [0.5, 0.5, 0.5],
        position: [0, 0, 0],
        rotation: [0, 0, 0]
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
    const [apples, setApples] = useState(Array(9).fill(false));
    const [score, setScore] = useState(0);
    const scene = useThree().scene;

    useEffect(() => {
      const popUpApple = () => {
        setApples(prevApples => {
          const newApples = [...prevApples];
          const inactiveIndices = newApples.reduce((acc, apple, index) => !apple ? [...acc, index] : acc, []);
          if (inactiveIndices.length > 0) {
            const randomIndex = inactiveIndices[Math.floor(Math.random() * inactiveIndices.length)];
            newApples[randomIndex] = true;
          }
          return newApples;
        });
      };

      const popDownApple = () => {
        setApples(prevApples => {
          const newApples = [...prevApples];
          const activeIndices = newApples.reduce((acc, apple, index) => apple ? [...acc, index] : acc, []);
          if (activeIndices.length > 0) {
            const randomIndex = activeIndices[Math.floor(Math.random() * activeIndices.length)];
            newApples[randomIndex] = false;
          }
          return newApples;
        });
      };

      const popUpInterval = setInterval(popUpApple, 1000);
      const popDownInterval = setInterval(popDownApple, 2000);

      return () => {
        clearInterval(popUpInterval);
        clearInterval(popDownInterval);
      };
    }, []);

    const grabApple = (index) => {
      if (apples[index]) {
        setScore(prevScore => prevScore + 1);
        setApples(prevApples => {
          const newApples = [...prevApples];
          newApples[index] = false;
          return newApples;
        });
      }
    };

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(Camera),
      React.createElement('ambientLight', { intensity: 0.5 }),
      React.createElement('pointLight', { position: [10, 10, 10] }),
      apples.map((isActive, index) => 
        React.createElement(Apple, {
          key: index,
          position: [
            (index % 3 - 1) * 4,
            0,
            (Math.floor(index / 3) - 1) * 4
          ],
          isActive: isActive,
          onGrab: () => grabApple(index)
        })
      ),
      React.createElement(Hand),
      React.createElement(Basket)
    );
  }

  return AppleGame;
};

console.log('3D Apple Grab game script loaded');
