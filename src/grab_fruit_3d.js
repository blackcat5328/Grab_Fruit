window.initGame = (React, assetsUrl) => {
    const { useState, useEffect, useRef, useMemo } = React;
    const { useFrame, useLoader, useThree } = window.ReactThreeFiber;
    const THREE = window.THREE;
    const { GLTFLoader } = window.THREE;

    const ModelLoader = React.memo(({ url, scale = [1, 1, 1], position = [0, 0, 0], rotation = [0, 0, 0] }) => {
        const gltf = useLoader(GLTFLoader, url);
        const copiedScene = useMemo(() => gltf.scene.clone(), [gltf]);

        useEffect(() => {
            copiedScene.scale.set(...scale);
            copiedScene.position.set(...position);
            copiedScene.rotation.set(...rotation);
        }, [copiedScene, scale, position, rotation]);

        return React.createElement('primitive', { object: copiedScene });
    });

    function Fruit({ type, position, onPickUp }) {
        const fruitUrl = type === 'apple' ? `${assetsUrl}/apple.glb` : `${assetsUrl}/banana.glb`;
        return React.createElement(
            'group',
            { position: position, onClick: onPickUp },
            React.createElement(ModelLoader, {
                url: fruitUrl,
                scale: [0.5, 0.5, 0.5],
            })
        );
    }

    function Hand({ heldFruit }) {
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
                rotation: [0, Math.PI / 2, 0],
            }),
            heldFruit && React.createElement(ModelLoader, {
                url: heldFruit.type === 'apple' ? `${assetsUrl}/apple.glb` : `${assetsUrl}/banana.glb`,
                scale: [0.5, 0.5, 0.5],
                position: [0, -0.5, 0],
            })
        );
    }

    function Basket({ position, onDrop, collectedFruits, type }) {
        const basketUrl = type === 'apple' ? `${assetsUrl}/basket_apple.glb` : `${assetsUrl}/basket_banana.glb`;

        return React.createElement(
            'group',
            { position: position, onClick: onDrop },
            React.createElement(ModelLoader, {
                url: basketUrl,
                scale: [2, 2, 2],
            }),
            collectedFruits.filter(fruit => fruit.type === type).map((fruit, index) => {
                const row = Math.floor(index / 4);
                const column = index % 4;
                const fruitUrl = `${assetsUrl}/${fruit.type}.glb`;
                return React.createElement(ModelLoader, {
                    key: index,
                    url: fruitUrl,
                    scale: [0.2, 0.2, 0.2],
                    position: [
                        column * 0.5 - 0.75,
                        0.7 + row * 0.3,
                        0,
                    ],
                });
            })
        );
    }

    function Notice1Board() {
        return React.createElement(ModelLoader, {
            url: `${assetsUrl}/notice_board.glb`,
            scale: [1, 1, 1],
            position: [-2, 2, -1],
            rotation: [0, -Math.PI / 2, 0],
        });
    }

    function APPLE() {
        return React.createElement(ModelLoader, {
            url: `${assetsUrl}/apple.glb`,
            scale: [0.5, 0.5, 0.2],
            position: [-2, 2, -0.9],
        });
    }
    
    function Notice2Board() {
        return React.createElement(ModelLoader, {
            url: `${assetsUrl}/notice_board.glb`,
            scale: [1, 1, 1],
            position: [2, 2, -1],
            rotation: [0, -Math.PI / 2, 0],
        });
    }

    function BANANA() {
        return React.createElement(ModelLoader, {
            url: `${assetsUrl}/banana.glb`,
            scale: [0.5, 0.5, 0.3],
            position: [2, 2, -0.9],
        });
    }

    function Camera() {
        const { camera } = useThree();
        useEffect(() => {
            camera.position.set(0, 2.5, 5.5);
            camera.lookAt(0, 0, 0);
        }, [camera]);

        return null;
    }

    function FruitGame() {
        const [fruits, setFruits] = useState([]);
        const [heldFruit, setHeldFruit] = useState(null);
        const [pickedFruits, setPickedFruits] = useState(Array(10).fill(false));
        const [collectedFruits, setCollectedFruits] = useState([]);

        useEffect(() => {
            const generateFruits = () => {
                const newFruits = Array.from({ length: 10 }, () => {
                    const type = Math.random() < 0.5 ? 'apple' : 'banana';
                    const xPosition = (Math.random() - 0.5) * 10; // X range
                    const zPosition = (Math.random() * 3) + 1; // Z range to keep fruits in front of the baskets
                    const yPosition = 0; // Keep yPosition low

                    return {
                        type,
                        position: [xPosition, yPosition, zPosition],
                    };
                });
                setFruits(newFruits);
            };
            generateFruits();
        }, []);

        const handleClick = (index) => {
            if (heldFruit === null) {
                setHeldFruit(fruits[index]);
                setPickedFruits((prev) => {
                    const newPicked = [...prev];
                    newPicked[index] = true;
                    return newPicked;
                });
            } else {
                setHeldFruit(null);
            }
        };

        const dropFruit = () => {
            if (heldFruit !== null) {
                setCollectedFruits((prev) => [...prev, heldFruit]);
                setHeldFruit(null);
            }
        };

        return React.createElement(
            React.Fragment,
            null,
            React.createElement(Camera),
            React.createElement('ambientLight', { intensity: 0.5 }),
            React.createElement('pointLight', { position: [10, 10, 10] }),
            fruits.map((fruit, index) =>
                !pickedFruits[index] && React.createElement(Fruit, {
                    key: index,
                    type: fruit.type,
                    position: fruit.position,
                    onPickUp: () => handleClick(index),
                })
            ),
            React.createElement(Basket, {
                position: [-2, 0, 0],
                onDrop: dropFruit,
                collectedFruits: collectedFruits,
                type: 'apple',  // This basket collects apples
            }),
            React.createElement(Basket, {
                position: [2, 0, 0],
                onDrop: dropFruit,
                collectedFruits: collectedFruits,
                type: 'banana', // This basket collects bananas
            }),
            React.createElement(Hand, {
                heldFruit: heldFruit,
            }),
            React.createElement(Notice1Board),
            React.createElement(APPLE),
            React.createElement(Notice2Board),
            React.createElement(BANANA)
        );
    }

    return FruitGame;
};

console.log('3D Fruit Collection game script loaded');
