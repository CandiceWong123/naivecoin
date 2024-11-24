class Blockchain:
    def __init__(self):
        self.chain = []
        self.difficulty = 2  # 初始难度
        self.block_time = 10  # 目标时间（秒）
    
    def add_block(self, new_block):
        if len(self.chain) > 0:
            previous_block = self.chain[-1]
            new_block.previous_hash = previous_block.hash
            new_block.nonce = self.proof_of_work(new_block)

        self.chain.append(new_block)
        self.adjust_difficulty()

    def adjust_difficulty(self):
        if len(self.chain) < 10:
            return  # 不足10个区块时不调整

        last_blocks = self.chain[-10:]  # 最近的10个区块
        time_taken = last_blocks[-1].timestamp - last_blocks[0].timestamp

        # 根据时间调整难度
        if time_taken < self.block_time * 10:
            self.difficulty += 1  # 增加难度
        elif time_taken > self.block_time * 10:
            self.difficulty -= 1  # 降低难度
