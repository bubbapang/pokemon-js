// handle the raw game logic

import BattleHUD from "./battleHUD.js";

// should only pertain to pure battle logic
// having a standardized lingo for the battle logic will make it easier to understand
export default class BattleLogic {
	constructor(battleMaker, player, enemy) {
		this.battleMaker = battleMaker;
		this.player = player;
		this.enemy = enemy;

		this.battleState = "Start";
		this.dialogueDelay = 1000;
	}

	init() {
		// healing the player and enemy to full
		this.player.healToFull();
		this.enemy.healToFull();

		this.battleHUD = new BattleHUD(this);
		this.battleHUD.init();
		this.initializeElements();
	}

	initializeElements() {
		this.fightChoices = document.querySelectorAll(".fight-choice");
		this.dialogue = document.getElementById("dialogue-text");
	}

	onFightButton() {
		this.playerTurn();
	}

	playerTurn() {
		this.battleState = "PlayerTurn";
		this.dialogue.innerText = "Choose a move!";
		this.enableButtons();
	}

	enemyTurn() {
		this.battleState = "EnemyTurn";
		this.dialogue.innerText = `${this.enemy.name} is thinking...`;
		this.disableButtons();
		this.enemyChoose();
	}

	disableButtons() {
		this.fightChoices.forEach((choice) => (choice.disabled = true));
	}

	enableButtons() {
		this.fightChoices.forEach((choice) => (choice.disabled = false));
	}

	makeMove(character, move) {
		setTimeout(() => {
			if (move.isHeal) {
				this.heal(character, move.value);
			} else {
				if (character === this.player) {
					this.attack(
						this.player,
						this.enemy,
						move,
						this.battleMaker.animateAttack.bind(this.player)
					);
				} else {
					this.attack(
						this.enemy,
						this.player,
						move,
						this.battleMaker.animateAttack.bind(this.enemy)
					);
				}
			}
		}, this.dialogueDelay);
	}

	playerChoose(choice) {
		this.disableButtons();
		const playerMove = this.player.moves[choice.id.slice(-1) - 1];
		this.dialogue.innerText = `${this.player.name} used ${playerMove.name}!`;

		// insert
		this.makeMove(this.player, playerMove);
	}

	enemyChoose() {
		let enemyMoves = [
			this.enemy.move1,
			this.enemy.move2,
			this.enemy.move3,
			this.enemy.move4,
		];

		// Filter out healing move if HP is full
		enemyMoves = enemyMoves.filter(
			(move) => !(move.isHeal && this.enemy.hp === this.enemy.maxHp)
		);

		let randomMove =
			enemyMoves[Math.floor(Math.random() * enemyMoves.length)];

		this.dialogue.innerText = `${this.enemy.name} used ${randomMove.name}!`;

		// insert
		this.makeMove(this.enemy, randomMove);
	}

	attack(attacker, defender, move, animationFunction) {
		// if the attack misses
		if (Math.random() * 100 > move.accuracy) {
			this.dialogue.innerText = "The attack missed!";
			this.battleState =
				attacker === this.player ? "EnemyTurn" : "PlayerTurn";
			setTimeout(() => {
				attacker === this.player ? this.enemyTurn() : this.playerTurn();
				if (attacker === this.player) {
					this.enemyChoose();
				}
			}, this.dialogueDelay);
			return;
		} else {
			// if the attack hits
			animationFunction();
			defender.takeDamage(move.value);
			let isDead = defender.isDead();
			this.battleHUD.updateCharacterHUD(defender);
			if (isDead) {
				// if the defender is dead
				this.battleState =
					attacker === this.player ? "PlayerWin" : "EnemyWin";
				this.dialogue.innerText = `${defender.name} fainted!`;
				this.battleHUD.updateCharacterHUD(defender);
				setTimeout(() => {
					this.endBattle();
				}, this.dialogueDelay);
			} else {
				// if the defender lives
				this.battleState =
					attacker === this.player ? "EnemyTurn" : "PlayerTurn";
				this.dialogue.innerText = `${defender.name} is hurt!`;
				setTimeout(() => {
					if (attacker === this.player) {
						this.enemyTurn();
					} else {
						this.playerTurn();
					}
				}, this.dialogueDelay);
			}
		}
	}

	heal(character, value) {
		character.takeHealing(value);
		this.battleHUD.updateCharacterHUD(character);
		this.dialogue.innerText = `${character.name} is healed!`;
		this.battleState =
			character === this.player ? "EnemyTurn" : "PlayerTurn";
		setTimeout(() => {
			character === this.player ? this.enemyTurn() : this.playerTurn();
		}, this.dialogueDelay);
	}

	endBattle() {
		if (this.battleState === "PlayerWin") {
			this.dialogue.innerText = "You won!";
		} else if (this.battleState === "EnemyWin") {
			this.dialogue.innerText = "You lost!";
		}
		this.disableButtons(); // Add this line to disable buttons when the battle ends
	}
}
