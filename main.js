onst config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    pixelArt: true,
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: { preload, create, update }
  };
  
  let player;
  let cursors;
  let infoText;
  let walls;
  let escaleraZona;
  let aulaZonas = [];
  let npc;
  let pisoActual = 1;
  
  const game = new Phaser.Game(config);
  
  function preload() {
    this.load.image('tiles', 'assets/tileset.png'); 
    this.load.spritesheet('player', 'assets/player.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('npc', 'assets/npc.png', { frameWidth: 32, frameHeight: 32 });
  }
  
  function create() {
    walls = this.physics.add.staticGroup();
  
    // Piso inicial
    drawPiso1(this);
  
    // Jugador
    player = this.physics.add.sprite(150, 150, 'player');
    player.setCollideWorldBounds(true);
  
    cursors = this.input.keyboard.createCursorKeys();
  
    // Texto info
    infoText = this.add.text(10, 550, '', { fontSize: '16px', fill: '#000', backgroundColor: '#fff' }).setScrollFactor(0);
  
    // Colisiones jugador
    this.physics.add.collider(player, walls);
  
    // Superposición con aulas
    this.physics.add.overlap(player, aulaZonas, (p, zona) => {
      infoText.setText(zona.data.get('info'));
    });
  
    // Superposición con escalera
    this.physics.add.overlap(player, escaleraZona, () => {
      if (pisoActual === 1) {
        drawPiso2(this);
        pisoActual = 2;
        spawnNearEscalera(2);
      } else {
        drawPiso1(this);
        pisoActual = 1;
        spawnNearEscalera(1);
      }
    });
  
    // NPC inicial en piso 1
    npc = this.physics.add.sprite(220, 160, 'npc');
    npc.setImmovable(true);
  
    // Colisión entre jugador y npc
    this.physics.add.collider(player, npc);
  
    // Asegurar que el jugador y NPC estén siempre arriba
    player.setDepth(10);
    npc.setDepth(9);
  }
  
  function update() {
    player.setVelocity(0);
  
    if (cursors.left.isDown) player.setVelocityX(-150);
    else if (cursors.right.isDown) player.setVelocityX(150);
  
    if (cursors.up.isDown) player.setVelocityY(-150);
    else if (cursors.down.isDown) player.setVelocityY(150);
  }
  
  // ----------------------------
  // FUNCIONES DE MAPA Y PISOS
  // ----------------------------
  
  function spawnNearEscalera(piso) {
    if (piso === 1) {
      player.setPosition(680, 500);
    } else if (piso === 2) {
      player.setPosition(80, 70);
    }
    player.setDepth(10); // asegurar siempre arriba
  }
  
  // Crear salón con puerta
  function createSalon(scene, x, y, w, h, info) {
    scene.add.rectangle(x, y, w, h, 0xcccccc).setOrigin(0).setDepth(1);
  
    // Paredes
    walls.add(scene.add.rectangle(x, y, w, 10).setOrigin(0).setDepth(2)); // arriba
    walls.add(scene.add.rectangle(x, y, 10, h).setOrigin(0).setDepth(2)); // izquierda
    walls.add(scene.add.rectangle(x + w - 10, y, 10, h).setOrigin(0).setDepth(2)); // derecha
    walls.add(scene.add.rectangle(x, y + h - 10, w/2 - 30, 10).setOrigin(0).setDepth(2)); // abajo izq
    walls.add(scene.add.rectangle(x + w/2 + 30, y + h - 10, w/2 - 30, 10).setOrigin(0).setDepth(2)); // abajo der
  
    // Zona interior interactiva
    let zona = scene.add.zone(x + 20, y + 20, w - 40, h - 40).setOrigin(0);
    zona.setData('info', info);
    scene.physics.add.existing(zona);
    aulaZonas.push(zona);
  }
  
  function drawPiso1(scene) {
    scene.add.rectangle(0, 0, 800, 600, 0xffffff).setOrigin(0).setDepth(0); 
    walls.clear(true, true);
    aulaZonas.forEach(z => z.destroy());
    aulaZonas = [];
  
    // Salones piso 1
    createSalon(scene, 150, 100, 200, 150, '📚 Aula 101\nLunes: 8am - 10am\nProfesor: Dr. Pérez');
    createSalon(scene, 450, 100, 200, 150, '📚 Aula 102\nMartes: 2pm - 4pm\nProfesora: Ing. López');
  
    // Escalera
    escaleraZona = scene.add.zone(700, 500, 50, 50).setOrigin(0);
    scene.add.rectangle(700, 500, 50, 50, 0x9999ff).setOrigin(0).setDepth(1);
    scene.physics.add.existing(escaleraZona);
  
    walls.getChildren().forEach(w => scene.physics.add.existing(w, true));
  }
  
  function drawPiso2(scene) {
    scene.add.rectangle(0, 0, 800, 600, 0xe0ffe0).setOrigin(0).setDepth(0);
    walls.clear(true, true);
    aulaZonas.forEach(z => z.destroy());
    aulaZonas = [];
  
    // Salones piso 2
    createSalon(scene, 200, 200, 200, 150, '📚 Aula 201\nMartes: 10am - 12pm\nProfesor: Lic. Gómez');
    createSalon(scene, 500, 200, 200, 150, '📚 Aula 202\nMiércoles: 1pm - 3pm\nProfesora: Dra. Ruiz');
  
    // Escalera
    escaleraZona = scene.add.zone(50, 50, 50, 50).setOrigin(0);
    scene.add.rectangle(50, 50, 50, 50, 0x9999ff).setOrigin(0).setDepth(1);
    scene.physics.add.existing(escaleraZona);
  
    walls.getChildren().forEach(w => scene.physics.add.existing(w, true));
  }
  
