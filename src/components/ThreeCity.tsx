import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

interface ThreeCityProps {
  scrollY: number;
  theme: 'light' | 'dark';
}

export const ThreeCity: React.FC<ThreeCityProps> = ({ scrollY, theme }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const bridgeModelRef = useRef<THREE.Group>();  // 2.glb - мост
  const cityModelRef = useRef<THREE.Group>();    // 3.glb - город
  const darkModelRef = useRef<THREE.Group>();    // 1.glb - темная тема
  const animationIdRef = useRef<number>();
  const starsRef = useRef<THREE.Points>();
  const shootingStarsRef = useRef<THREE.Group>();
  
  // Отдельные источники света для светлой темы (только для моделей 2 и 3)
  const lightThemeLightsRef = useRef<THREE.Group>();
  
  // Отдельные источники света для темной темы (только для модели 1)
  const darkThemeLightsRef = useRef<THREE.Group>();
  
  const fallingStarsRef = useRef<THREE.Group>();
  const starsTargetRotationRef = useRef(0);
  const starsCurrentRotationRef = useRef(0);
  const currentModelPathRef = useRef<string>('');
  
  // Для плавного скролла
  const smoothScrollRef = useRef({
    current: 0,
    target: 0
  });

  // Функция для интерполации между значениями
  const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
  };

  // Функция для плавной интерполации (easing)
  const easeInOutCubic = (t: number) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  // Функция обновления камеры для обеих тем
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;

    const camera = cameraRef.current;
    const angle = smoothScrollRef.current.current * 0.001;

    if (theme === 'light') {
      // Для светлой темы - орбита вокруг центра между мостом и городом
      const radius = 35;
      const height = 4;
      
      const centerX = 5; // Центр между мостом и городом
      const centerY = 1;
      const centerZ = -10;
      
      camera.position.x = centerX + Math.cos(angle) * radius;
      camera.position.y = height;
      camera.position.z = centerZ + Math.sin(angle) * radius;
      
      camera.lookAt(centerX, centerY, centerZ);
    } else {
      // Для темной темы - орбита вокруг модели 1.glb
      const radius = 70; // Уменьшили с 80 до 70 для приближения к модели
      const height = 25;
      
      const centerX = 0; // Центр модели 1.glb
      const centerY = -5;
      const centerZ = 0;
      
      camera.position.x = centerX + Math.cos(angle) * radius;
      camera.position.y = height;
      camera.position.z = centerZ + Math.sin(angle) * radius;
      
      camera.lookAt(centerX, centerY, centerZ);
    }
    
    camera.updateProjectionMatrix();
  };

  // Функция для очистки модели
  const cleanupModel = (modelRef: React.MutableRefObject<THREE.Group | undefined>, scene: THREE.Scene) => {
    if (modelRef.current) {
      console.log('Cleaning up model');
      scene.remove(modelRef.current);
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          } else if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          }
        }
      });
      modelRef.current = undefined;
    }
  };

  // Функция для загрузки 3D модели
  const loadCityModel = (modelPath: string, scene: THREE.Scene, modelRef: React.MutableRefObject<THREE.Group | undefined>, position: THREE.Vector3 = new THREE.Vector3(0, 0, 0), scale: number = 1, renderer?: THREE.WebGLRenderer) => {
    console.log(`Attempting to load model: ${modelPath} at position:`, position);
    
    // Удаляем предыдущую модель если она есть
    cleanupModel(modelRef, scene);

    // Загружаем новую модель
    const loader = new GLTFLoader();
    
    // Настраиваем DRACO loader для сжатых моделей
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(dracoLoader);
    
    loader.load(
      modelPath,
      (gltf) => {
        console.log(`✅ Successfully loaded model: ${modelPath}`);
        
        const model = gltf.scene;
        modelRef.current = model;
        
        // Вычисляем bounding box для отладки
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        console.log('Model size:', size);
        
        // Применяем масштаб и позицию
        model.scale.set(scale, scale, scale);
        model.position.copy(position);
        
        console.log(`Model positioned at:`, model.position);
        console.log(`Model scale:`, model.scale);
        
        // Настройка теней и материалов
        let meshCount = 0;
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // Тени только для светлой темы (модели 2 и 3)
            if (modelPath.includes('2.glb') || modelPath.includes('3.glb')) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
            
            // Восстанавливаем цвета и материалы для правильного отображения
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  if (mat instanceof THREE.MeshStandardMaterial) {
                    // Убеждаемся что цвета сохранены
                    mat.metalness = Math.min(mat.metalness, 0.3); // Уменьшаем металличность
                    mat.roughness = Math.max(mat.roughness, 0.4); // Увеличиваем шероховатость
                    
                    // Улучшенные настройки текстур для избежания ряби (только если renderer доступен)
                    if (mat.map && renderer) {
                      mat.map.colorSpace = THREE.SRGBColorSpace;
                      mat.map.anisotropy = renderer.capabilities.getMaxAnisotropy(); // Максимальная анизотропная фильтрация
                      mat.map.generateMipmaps = true;
                      mat.map.minFilter = THREE.LinearMipmapLinearFilter;
                      mat.map.magFilter = THREE.LinearFilter;
                      mat.map.wrapS = THREE.ClampToEdgeWrapping; // Предотвращает артефакты на краях
                      mat.map.wrapT = THREE.ClampToEdgeWrapping;
                    } else if (mat.map) {
                      mat.map.colorSpace = THREE.SRGBColorSpace;
                    }
                    
                    // Аналогичные настройки для других карт
                    if (mat.normalMap && renderer) {
                      mat.normalMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
                      mat.normalMap.generateMipmaps = true;
                      mat.normalMap.minFilter = THREE.LinearMipmapLinearFilter;
                      mat.normalMap.wrapS = THREE.ClampToEdgeWrapping;
                      mat.normalMap.wrapT = THREE.ClampToEdgeWrapping;
                    }
                    
                    if (mat.roughnessMap && renderer) {
                      mat.roughnessMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
                      mat.roughnessMap.generateMipmaps = true;
                      mat.roughnessMap.minFilter = THREE.LinearMipmapLinearFilter;
                      mat.roughnessMap.wrapS = THREE.ClampToEdgeWrapping;
                      mat.roughnessMap.wrapT = THREE.ClampToEdgeWrapping;
                    }
                    
                    // Дополнительные настройки для моста (2.glb) для уменьшения ряби
                    if (modelPath.includes('2.glb')) {
                      mat.roughness = Math.max(mat.roughness, 0.6); // Увеличиваем шероховатость для моста
                      mat.metalness = Math.min(mat.metalness, 0.2); // Уменьшаем металличность
                    }
                    
                    mat.needsUpdate = true;
                  } else if (mat instanceof THREE.MeshBasicMaterial) {
                    // Улучшения для базовых материалов
                    if (mat.map && renderer) {
                      mat.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
                      mat.map.generateMipmaps = true;
                      mat.map.minFilter = THREE.LinearMipmapLinearFilter;
                      mat.map.magFilter = THREE.LinearFilter;
                      mat.map.wrapS = THREE.ClampToEdgeWrapping;
                      mat.map.wrapT = THREE.ClampToEdgeWrapping;
                    }
                    mat.needsUpdate = true;
                  }
                });
              } else if (child.material instanceof THREE.MeshStandardMaterial) {
                // Восстанавливаем цвета для стандартного материала
                child.material.metalness = Math.min(child.material.metalness, 0.3);
                child.material.roughness = Math.max(child.material.roughness, 0.4);
                
                // Улучшенные настройки текстур
                if (child.material.map && renderer) {
                  child.material.map.colorSpace = THREE.SRGBColorSpace;
                  child.material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
                  child.material.map.generateMipmaps = true;
                  child.material.map.minFilter = THREE.LinearMipmapLinearFilter;
                  child.material.map.magFilter = THREE.LinearFilter;
                  child.material.map.wrapS = THREE.ClampToEdgeWrapping;
                  child.material.map.wrapT = THREE.ClampToEdgeWrapping;
                } else if (child.material.map) {
                  child.material.map.colorSpace = THREE.SRGBColorSpace;
                }
                
                if (child.material.normalMap && renderer) {
                  child.material.normalMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
                  child.material.normalMap.generateMipmaps = true;
                  child.material.normalMap.minFilter = THREE.LinearMipmapLinearFilter;
                  child.material.normalMap.wrapS = THREE.ClampToEdgeWrapping;
                  child.material.normalMap.wrapT = THREE.ClampToEdgeWrapping;
                }
                
                if (child.material.roughnessMap && renderer) {
                  child.material.roughnessMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
                  child.material.roughnessMap.generateMipmaps = true;
                  child.material.roughnessMap.minFilter = THREE.LinearMipmapLinearFilter;
                  child.material.roughnessMap.wrapS = THREE.ClampToEdgeWrapping;
                  child.material.roughnessMap.wrapT = THREE.ClampToEdgeWrapping;
                }
                
                // Дополнительные настройки для моста (2.glb)
                if (modelPath.includes('2.glb')) {
                  child.material.roughness = Math.max(child.material.roughness, 0.6);
                  child.material.metalness = Math.min(child.material.metalness, 0.2);
                }
                
                child.material.needsUpdate = true;
              } else if (child.material instanceof THREE.MeshBasicMaterial) {
                if (child.material.map && renderer) {
                  child.material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
                  child.material.map.generateMipmaps = true;
                  child.material.map.minFilter = THREE.LinearMipmapLinearFilter;
                  child.material.map.magFilter = THREE.LinearFilter;
                  child.material.map.wrapS = THREE.ClampToEdgeWrapping;
                  child.material.map.wrapT = THREE.ClampToEdgeWrapping;
                }
                child.material.needsUpdate = true;
              }
            }
            
            meshCount++;
          }
        });
        
        console.log(`Total meshes found: ${meshCount}`);
        
        scene.add(model);
        console.log(`✅ Model added to scene: ${modelPath}`);
      },
      (progress) => {
        const percent = (progress.loaded / progress.total * 100).toFixed(1);
        console.log(`Loading progress ${modelPath}: ${percent}%`);
      },
      (error) => {
        console.error(`❌ Error loading GLB model (${modelPath}):`, error);
        
        // Fallback: создаем простой placeholder
        const geometry = new THREE.BoxGeometry(4, 4, 4);
        const material = new THREE.MeshLambertMaterial({ 
          color: theme === 'light' ? 0x4f46e5 : 0x8b5cf6 
        });
        const placeholder = new THREE.Mesh(geometry, material);
        placeholder.position.copy(position);
        modelRef.current = placeholder;
        scene.add(placeholder);
        console.log('Added error fallback placeholder');
      }
    );
  };

  // Функция для очистки всех моделей
  const cleanupAllModels = (scene: THREE.Scene) => {
    cleanupModel(bridgeModelRef, scene);
    cleanupModel(cityModelRef, scene);
    cleanupModel(darkModelRef, scene);
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // Настройка сцены
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Настройка камеры
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    // Улучшенные настройки камеры для уменьшения ряби
    camera.near = 1; // Увеличили near plane
    camera.far = 500; // Уменьшили far plane для лучшей точности глубины
    
    if (theme === 'light') {
      // Начальная позиция - фокус на городе, мост за кадром
      camera.position.set(-60, 4, 0); // Камера смотрит на город, мост скрыт
      camera.fov = 60;
      camera.lookAt(-25, 0, 0); // Смотрим прямо на город
    } else {
      // Позиция для темной темы
      camera.position.set(0, 25, 80);
      camera.fov = 75;
      camera.lookAt(0, -5, 0);
    }
    
    camera.updateProjectionMatrix();
    cameraRef.current = camera;

    // Настройка рендерера
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Ограничиваем pixel ratio для производительности
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Улучшенные настройки для избежания ряби
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Создаем группу освещения для светлой темы (только для моделей 2 и 3)
    const lightThemeGroup = new THREE.Group();
    lightThemeLightsRef.current = lightThemeGroup;
    scene.add(lightThemeGroup);

    // Создаем группу освещения для темной темы (только для модели 1)
    const darkThemeGroup = new THREE.Group();
    darkThemeLightsRef.current = darkThemeGroup;
    scene.add(darkThemeGroup);

    // Загружаем модели в зависимости от темы
    if (theme === 'light') {
      // Для светлой темы загружаем мост и город
      console.log('Loading light theme models...');
      loadCityModel('/models/2.glb', scene, bridgeModelRef, new THREE.Vector3(35, 2, -20), 8, renderer); // Мост (2.glb) - правильная позиция
      loadCityModel('/models/3.glb', scene, cityModelRef, new THREE.Vector3(-25, 0, 0), 5, renderer);     // Город (3.glb)
      currentModelPathRef.current = 'light_mode';

      // Создаем ЯРКОЕ освещение для светлой темы (модели 2 и 3.glb)
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
      lightThemeGroup.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
      directionalLight.position.set(15, 12, -10);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      lightThemeGroup.add(directionalLight);

      const topLight = new THREE.DirectionalLight(0xffffff, 1.5);
      topLight.position.set(0, 50, 0);
      topLight.target.position.set(0, 0, 0);
      lightThemeGroup.add(topLight);
      lightThemeGroup.add(topLight.target);

      const sideLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
      sideLight1.position.set(-20, 10, 10);
      lightThemeGroup.add(sideLight1);

      const sideLight2 = new THREE.DirectionalLight(0xffffff, 1.2);
      sideLight2.position.set(20, 10, 10);
      lightThemeGroup.add(sideLight2);

      const cityLight = new THREE.DirectionalLight(0xffffff, 1.8);
      cityLight.position.set(-25, 30, 15);
      lightThemeGroup.add(cityLight);

      const bridgeLight = new THREE.DirectionalLight(0xffffff, 1.8);
      bridgeLight.position.set(15, 25, 15);
      lightThemeGroup.add(bridgeLight);

      // Скрываем освещение темной темы
      darkThemeGroup.visible = false;

    } else {
      // Для темной темы одна модель
      console.log('Loading dark theme model...');
      loadCityModel('/models/1.glb', scene, darkModelRef, new THREE.Vector3(0, -5, 0), 0.1, renderer);
      currentModelPathRef.current = 'dark_mode';

      // Немного улучшенное освещение для темной темы (модель 1.glb)
      const darkAmbientLight = new THREE.AmbientLight(0x404060, 0.3); // Уменьшили с 0.4 до 0.3
      darkThemeGroup.add(darkAmbientLight);

      // Мягкий свет сверху для 1.glb
      const darkTopLight = new THREE.DirectionalLight(0x6666aa, 0.5); // Уменьшили с 0.6 до 0.5
      darkTopLight.position.set(0, 50, 0);
      darkTopLight.target.position.set(0, -5, 0);
      darkThemeGroup.add(darkTopLight);
      darkThemeGroup.add(darkTopLight.target);

      // Скрываем освещение светлой темы
      lightThemeGroup.visible = false;
    }

    // Создаем звезды
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 2000;
    const positions = new Float32Array(starsCount * 3);
    
    for (let i = 0; i < starsCount * 3; i += 3) {
      const radius = Math.random() * 200 + 150;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.cos(phi);
      positions[i + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starsMaterial = new THREE.PointsMaterial({ 
      color: 0xffffff, 
      size: 1.5,
      transparent: true,
      opacity: 0.8
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    starsRef.current = stars;
    scene.add(stars);

    // Создаем группу падающих звезд
    const fallingStarsGroup = new THREE.Group();
    fallingStarsRef.current = fallingStarsGroup;
    scene.add(fallingStarsGroup);

    // Функция создания падающих звезд
    const createFallingStar = () => {
      const starGeometry = new THREE.SphereGeometry(0.1, 4, 4);
      const starMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: Math.random() * 0.8 + 0.2
      });
      const fallingStar = new THREE.Mesh(starGeometry, starMaterial);
      
      const radius = Math.random() * 50 + 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      fallingStar.position.set(
        radius * Math.sin(phi) * Math.cos(theta),
        Math.random() * 100 + 50,
        radius * Math.sin(phi) * Math.sin(theta)
      );
      
      fallingStarsGroup.add(fallingStar);
      
      const velocity = {
        x: (Math.random() - 0.5) * 0.1,
        y: -Math.random() * 0.3 - 0.1,
        z: (Math.random() - 0.5) * 0.1
      };
      
      const animateFallingStar = () => {
        fallingStar.position.x += velocity.x;
        fallingStar.position.y += velocity.y;
        fallingStar.position.z += velocity.z;
        
        starMaterial.opacity -= 0.005;
        
        if (starMaterial.opacity > 0 && fallingStar.position.y > -50) {
          requestAnimationFrame(animateFallingStar);
        } else {
          fallingStarsGroup.remove(fallingStar);
          starGeometry.dispose();
          starMaterial.dispose();
        }
      };
      
      animateFallingStar();
    };
    
    const fallingStarInterval = setInterval(() => {
      if (Math.random() < 0.3) {
        createFallingStar();
      }
    }, 2000);

    // Создаем группу метеоров
    const shootingStarsGroup = new THREE.Group();
    shootingStarsRef.current = shootingStarsGroup;
    scene.add(shootingStarsGroup);

    // Анимация метеоров
    const createShootingStar = () => {
      const shootingStarGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(6);
      
      const startX = (Math.random() - 0.5) * 60;
      const startY = Math.random() * 20 + 15;
      const startZ = (Math.random() - 0.5) * 60;
      
      positions[0] = startX;
      positions[1] = startY;
      positions[2] = startZ;
      positions[3] = startX;
      positions[4] = startY;
      positions[5] = startZ;
      
      shootingStarGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const shootingStarMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1
      });
      
      const shootingStar = new THREE.Line(shootingStarGeometry, shootingStarMaterial);
      shootingStarsGroup.add(shootingStar);
      
      const velocity = {
        x: (Math.random() - 0.5) * 0.3,
        y: -Math.random() * 0.2 - 0.1,
        z: (Math.random() - 0.5) * 0.3
      };
      
      const animateShootingStar = () => {
        const positions = shootingStar.geometry.attributes.position.array as Float32Array;
        
        positions[0] = positions[3];
        positions[1] = positions[4];
        positions[2] = positions[5];
        
        positions[3] += velocity.x;
        positions[4] += velocity.y;
        positions[5] += velocity.z;
        
        shootingStar.geometry.attributes.position.needsUpdate = true;
        
        shootingStarMaterial.opacity -= 0.02;
        
        if (shootingStarMaterial.opacity > 0 && positions[4] > -10) {
          requestAnimationFrame(animateShootingStar);
        } else {
          shootingStarsGroup.remove(shootingStar);
          shootingStar.geometry.dispose();
          shootingStarMaterial.dispose();
        }
      };
      
      animateShootingStar();
    };
    
    const shootingStarInterval = setInterval(() => {
      if (Math.random() < 0.7) {
        createShootingStar();
      }
    }, 7000);

    // Основной цикл анимации
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      // Плавная интерполяция с правильным торможением
      const diff = smoothScrollRef.current.target - smoothScrollRef.current.current;
      
      // Простое и плавное приближение к цели
      smoothScrollRef.current.current += diff * 0.08; // Плавное движение к цели
      
      // Обновляем позицию камеры для любой темы
      updateCameraPosition();
      
      // Анимируем мерцание звезд
      if (starsRef.current) {
        if (Math.random() < 0.002) {
          const material = starsRef.current.material as THREE.PointsMaterial;
          material.opacity = Math.random() * 0.4 + 0.6;
        }
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Плавная анимация вращения звезд
    const animateStarsRotation = () => {
      if (starsRef.current) {
        const diff = starsTargetRotationRef.current - starsCurrentRotationRef.current;
        starsCurrentRotationRef.current += diff * 0.02;
        
        starsRef.current.rotation.y = starsCurrentRotationRef.current;
      }
      requestAnimationFrame(animateStarsRotation);
    };
    
    const starsAnimationId = requestAnimationFrame(animateStarsRotation);

    // Обработчик изменения размера окна
    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(shootingStarInterval);
      clearInterval(fallingStarInterval);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      cancelAnimationFrame(starsAnimationId);
      
      // Очищаем все модели при размонтировании
      cleanupAllModels(scene);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [theme]); // Вернул зависимость от theme для правильной инициализации

  // Обновляем сцену в зависимости от темы
  useEffect(() => {
    if (!sceneRef.current || !lightThemeLightsRef.current || !darkThemeLightsRef.current) return;

    const isDay = theme === 'light';
    const newMode = isDay ? 'light_mode' : 'dark_mode';
    
    // Переключаем модели только при смене темы
    if (currentModelPathRef.current !== newMode) {
      console.log('Switching theme to:', newMode);
      currentModelPathRef.current = newMode;
      
      if (isDay) {
        // Очищаем темную модель
        cleanupModel(darkModelRef, sceneRef.current);
        
        // Показываем освещение для светлой темы
        lightThemeLightsRef.current.visible = true;
        darkThemeLightsRef.current.visible = false;
        
        // Загружаем светлые модели с правильными позициями
        console.log('Switching to light theme models...');
        loadCityModel('/models/2.glb', sceneRef.current, bridgeModelRef, new THREE.Vector3(35, 2, -20), 8, rendererRef.current || undefined); // Мост (2.glb)
        loadCityModel('/models/3.glb', sceneRef.current, cityModelRef, new THREE.Vector3(-25, 0, 0), 5, rendererRef.current || undefined);     // Город (3.glb)
        
        // Устанавливаем начальную позицию камеры на городе
        if (cameraRef.current) {
          cameraRef.current.position.set(-60, 4, 0); // Камера смотрит на город, мост скрыт
          cameraRef.current.fov = 60;
          cameraRef.current.lookAt(-25, 0, 0); // Смотрим прямо на город
          cameraRef.current.updateProjectionMatrix();
        }
      } else {
        // Очищаем светлые модели
        cleanupModel(bridgeModelRef, sceneRef.current);
        cleanupModel(cityModelRef, sceneRef.current);
        
        // Показываем освещение для темной темы
        lightThemeLightsRef.current.visible = false;
        darkThemeLightsRef.current.visible = true;
        
        // Загружаем темную модель
        loadCityModel('/models/1.glb', sceneRef.current, darkModelRef, new THREE.Vector3(0, -5, 0), 0.1, rendererRef.current || undefined);
        
        // Устанавливаем позицию камеры для темной темы
        if (cameraRef.current) {
          cameraRef.current.position.set(0, 25, 80);
          cameraRef.current.fov = 75;
          cameraRef.current.lookAt(0, -5, 0);
          cameraRef.current.updateProjectionMatrix();
        }
      }
    }
    
    if (rendererRef.current) {
      rendererRef.current.setClearColor(isDay ? 0x87CEEB : 0x0a0a0a, 0);
    }

    if (starsRef.current) {
      starsRef.current.visible = !isDay;
    }
  }, [theme]);

  // Обновляем движение в зависимости от скролла
  useEffect(() => {
    // Обновляем целевое значение для плавного скролла
    smoothScrollRef.current.target = scrollY;
    
    // Звезды вращаются в любой теме
    starsTargetRotationRef.current = -scrollY * 0.0002;
  }, [scrollY, theme]);

  return (
    <div 
      ref={mountRef} 
      className="fixed inset-0 w-full h-full z-0"
      style={{ pointerEvents: 'none' }}
    />
  );
};