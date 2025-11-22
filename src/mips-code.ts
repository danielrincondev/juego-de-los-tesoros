export const mipsCode = `
.data
    # Constants
    TREASURE_MARK: .word -1
    EMPTY_MARK: .word 0
    
.text
.globl main

# Registers Mapping:
# $s0: Player Position
# $s1: Player Money
# $s2: Player Treasures
# $s3: Machine Position
# $s4: Machine Money
# $s5: Machine Treasures
# $s6: Board Size
# $s7: Board Base Address

main:
    li $v0, 0      # Command register (0=Idle)
    
wait_loop:
    beq $v0, 0, wait_loop   # Wait for JS to set $v0 != 0
    
    # Dispatcher
    beq $v0, 1, cmd_init
    beq $v0, 2, cmd_player_move
    beq $v0, 3, cmd_machine_move
    
    # Unknown command, reset
    li $v0, 0
    j wait_loop

# --- COMMAND: INIT GAME ---
# Input: $a0 = Board Size
cmd_init:
    move $s6, $a0       # Set Board Size
    
    # Reset State
    li $s0, 0           # P Pos
    li $s1, 0           # P Money
    li $s2, 0           # P Treasures
    li $s3, 0           # M Pos
    li $s4, 0           # M Money
    li $s5, 0           # M Treasures
    
    # Allocate Memory for Board (Size * 4)
    li $v0, 9           # sbrk
    mul $a0, $s6, 4     # bytes needed
    syscall
    move $s7, $v0       # Save Board Address
    
    # Initialize Board with Money ($10-$100)
    move $t0, $s7       # Iterator
    li $t1, 0           # Counter
    
init_board_loop:
    bge $t1, $s6, place_treasures
    
    # Generate Random Money (10-100)
    li $v0, 42          # Random int range
    li $a0, 0           # ID
    li $a1, 91          # Range 0-90
    syscall
    add $a0, $a0, 10    # 10-100
    
    sw $a0, 0($t0)      # Store money
    
    add $t0, $t0, 4     # Next address
    add $t1, $t1, 1     # Next index
    j init_board_loop

place_treasures:
    # Calculate num treasures (30%)
    mul $t0, $s6, 3
    div $t0, $t0, 10    # $t0 = num treasures
    li $t1, 0           # placed count
    
place_treasures_loop:
    bge $t1, $t0, init_done
    
    # Random Index
    li $v0, 42
    li $a0, 0
    move $a1, $s6
    syscall             # $a0 = random index
    
    # Calculate Address
    mul $t2, $a0, 4
    add $t2, $s7, $t2   # $t2 = address of tile
    
    lw $t3, 0($t2)      # Load current value
    li $t4, -1          # Treasure mark
    beq $t3, $t4, place_treasures_loop # Already treasure, try again
    
    sw $t4, 0($t2)      # Place treasure
    add $t1, $t1, 1
    j place_treasures_loop

init_done:
    li $v0, 0           # Signal Done
    j wait_loop


# --- COMMAND: PLAYER MOVE ---
# Input: $a0 = Steps
cmd_player_move:
    move $t0, $a0       # Steps
    add $s0, $s0, $t0   # New Pos
    
    # Check Bounds
    sub $t1, $s6, 1     # Max Index
    ble $s0, $t1, check_tile_p
    move $s0, $t1       # Clamp to max
    
check_tile_p:
    # Get Tile Address
    mul $t2, $s0, 4
    add $t2, $s7, $t2
    
    lw $t3, 0($t2)      # Load Tile Value
    
    # Check if claimed (0)
    beq $t3, 0, p_move_done
    
    # Check type
    li $t4, -1
    beq $t3, $t4, p_found_treasure
    
    # Found Money
    add $s1, $s1, $t3   # Add Money
    sw $zero, 0($t2)    # Mark claimed
    j p_move_done

p_found_treasure:
    add $s2, $s2, 1     # Add Treasure
    sw $zero, 0($t2)    # Mark claimed
    
p_move_done:
    li $v0, 0           # Signal Done
    j wait_loop


# --- COMMAND: MACHINE MOVE ---
# Input: None (Random 1-6)
cmd_machine_move:
    # Generate Random Steps 1-6
    li $v0, 42
    li $a0, 0
    li $a1, 6
    syscall
    add $t0, $a0, 1     # Steps (1-6)
    
    # Save Roll to $v1 for JS to read
    move $v1, $t0
    
    add $s3, $s3, $t0   # New Pos
    
    # Check Bounds
    sub $t1, $s6, 1
    ble $s3, $t1, check_tile_m
    move $s3, $t1
    
check_tile_m:
    # Get Tile Address
    mul $t2, $s3, 4
    add $t2, $s7, $t2
    
    lw $t3, 0($t2)
    
    beq $t3, 0, m_move_done
    
    li $t4, -1
    beq $t3, $t4, m_found_treasure
    
    add $s4, $s4, $t3   # Add Money
    sw $zero, 0($t2)
    j m_move_done

m_found_treasure:
    add $s5, $s5, 1     # Add Treasure
    sw $zero, 0($t2)

m_move_done:
    li $v0, 0           # Signal Done
    j wait_loop
`;
