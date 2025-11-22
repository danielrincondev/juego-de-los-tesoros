export const mipsCode = `
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
`;
