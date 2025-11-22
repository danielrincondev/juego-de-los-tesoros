# Documentación del Proyecto

Este proyecto implementa la lógica de un juego de mesa utilizando código ensamblador MIPS, simulado dentro de un entorno TypeScript.

## Código Fuente

```asm
.data
    TREASURE_MARK: .word -1
    EMPTY_MARK: .word 0

.text
.globl main

main:
    li $v0, 0

wait_loop:
    beq $v0, 0, wait_loop

    beq $v0, 1, cmd_init
    beq $v0, 2, cmd_player_move
    beq $v0, 3, cmd_machine_move

    li $v0, 0
    j wait_loop

cmd_init:
    move $s6, $a0

    li $s0, 0
    li $s1, 0
    li $s2, 0
    li $s3, 0
    li $s4, 0
    li $s5, 0

    li $v0, 9
    mul $a0, $s6, 4
    syscall
    move $s7, $v0

    move $t0, $s7
    li $t1, 0

init_board_loop:
    bge $t1, $s6, place_treasures

    li $v0, 42
    li $a0, 0
    li $a1, 91
    syscall
    add $a0, $a0, 10

    sw $a0, 0($t0)

    add $t0, $t0, 4
    add $t1, $t1, 1
    j init_board_loop

place_treasures:
    mul $t0, $s6, 3
    div $t0, $t0, 10
    li $t1, 0

place_treasures_loop:
    bge $t1, $t0, init_done

    li $v0, 42
    li $a0, 0
    move $a1, $s6
    syscall

    mul $t2, $a0, 4
    add $t2, $s7, $t2

    lw $t3, 0($t2)
    li $t4, -1
    beq $t3, $t4, place_treasures_loop

    sw $t4, 0($t2)
    add $t1, $t1, 1
    j place_treasures_loop

init_done:
    li $v0, 0
    j wait_loop


cmd_player_move:
    move $t0, $a0
    add $s0, $s0, $t0

    sub $t1, $s6, 1
    ble $s0, $t1, check_tile_p
    move $s0, $t1

check_tile_p:
    mul $t2, $s0, 4
    add $t2, $s7, $t2

    lw $t3, 0($t2)

    beq $t3, 0, p_move_done

    li $t4, -1
    beq $t3, $t4, p_found_treasure

    add $s1, $s1, $t3
    sw $zero, 0($t2)
    j p_move_done

p_found_treasure:
    add $s2, $s2, 1
    sw $zero, 0($t2)

p_move_done:
    li $v0, 0
    j wait_loop


cmd_machine_move:
    li $v0, 42
    li $a0, 0
    li $a1, 6
    syscall
    add $t0, $a0, 1

    move $v1, $t0

    add $s3, $s3, $t0

    sub $t1, $s6, 1
    ble $s3, $t1, check_tile_m
    move $s3, $t1

check_tile_m:
    mul $t2, $s3, 4
    add $t2, $s7, $t2

    lw $t3, 0($t2)

    beq $t3, 0, m_move_done

    li $t4, -1
    beq $t3, $t4, m_found_treasure

    add $s4, $s4, $t3
    sw $zero, 0($t2)
    j m_move_done

m_found_treasure:
    add $s5, $s5, 1
    sw $zero, 0($t2)

m_move_done:
    li $v0, 0
    j wait_loop
```

## Explicación del Código MIPS

La lógica central del juego está escrita en ensamblador MIPS y maneja el estado del juego, incluyendo el tablero, las posiciones de los jugadores y los puntajes. El código MIPS interactúa con la aplicación principal a través de registros específicos que actúan como disparadores de comandos.

### Flujo de Control (`wait_loop`)

El programa se ejecuta en un bucle infinito (`wait_loop`) monitoreando el registro `$v0`. La aplicación externa escribe en `$v0` para ejecutar comandos:

- **`$v0 = 1`**: Inicializar Juego (`cmd_init`)
- **`$v0 = 2`**: Movimiento del Jugador (`cmd_player_move`)
- **`$v0 = 3`**: Movimiento de la Máquina (`cmd_machine_move`)

Después de ejecutar un comando, `$v0` se restablece a `0` para señalar la finalización.

### Uso de Registros

Los siguientes registros se conservan durante la sesión de juego para mantener el estado:

- **`$s0`**: Posición del Jugador (Índice en el tablero)
- **`$s1`**: Puntaje del Jugador (Suma de valores recolectados)
- **`$s2`**: Tesoros Encontrados por el Jugador (Conteo de casillas `-1` encontradas)
- **`$s3`**: Posición de la Máquina
- **`$s4`**: Puntaje de la Máquina
- **`$s5`**: Tesoros Encontrados por la Máquina
- **`$s6`**: Tamaño del Tablero (Número de casillas)
- **`$s7`**: Dirección Base del Arreglo del Tablero (Puntero al Heap)

### Comandos

#### 1. Inicialización (`cmd_init`)

- **Entrada**: `$a0` recibe el tamaño del tablero.
- **Acción**:
  - Reinicia todos los registros de puntaje y posición (`$s0` - `$s5`) a 0.
  - Asigna memoria para el tablero usando `syscall 9` (sbrk).
  - Llena el tablero con valores aleatorios entre **10 y 100**.
  - Coloca aleatoriamente **tesoros** (marcados como `-1`) en aproximadamente el 30% de las casillas.

#### 2. Movimiento del Jugador (`cmd_player_move`)

- **Entrada**: `$a0` recibe el número de pasos a mover (tirada de dados).
- **Acción**:
  - Actualiza la posición del jugador (`$s0`).
  - Limita la posición a los límites del tablero.
  - Verifica la casilla en la nueva posición:
    - **Valor > 0**: Suma el valor al Puntaje del Jugador (`$s1`) y limpia la casilla (la establece en 0).
    - **Valor = -1 (Tesoro)**: Incrementa los Tesoros del Jugador (`$s2`) y limpia la casilla.
    - **Valor = 0**: Sin efecto.

#### 3. Movimiento de la Máquina (`cmd_machine_move`)

- **Acción**:
  - Genera un movimiento aleatorio entre **1 y 6**.
  - Devuelve el movimiento generado en `$v1` para la UI.
  - Actualiza la posición de la máquina (`$s3`).
  - Realiza las mismas verificaciones de casilla y lógica de puntuación que el jugador, actualizando el Puntaje de la Máquina (`$s4`) y los Tesoros de la Máquina (`$s5`).

### Representación en Memoria

El tablero es un arreglo de palabras (4 bytes cada una).

- **Enteros Positivos**: Puntos para recolectar.
- **-1**: Representa un Tesoro.
- **0**: Representa una casilla vacía/visitada.
