window.EggGameModules = window.EggGameModules || {};

window.EggGameModules.logic = {
    chooseEggType() {
        const r = Math.random();
        let sum = 0;
        for (const egg of this.eggTypes) {
            sum += egg.chance;
            if (r <= sum) return egg;
        }
        return this.eggTypes[0];
    },

    getLineCenterBaseX(line) {
        return line.startX + line.slotWidth * 0.5;
    },

    getLineSlotCenterXAtClock(line, slotIndex, clock = this.speedClock) {
        return this.getLineCenterBaseX(line) + slotIndex * line.slotWidth + line.speed * line.dir * clock;
    },

    getNearestLineSlotIndex(line, x, clock = this.speedClock) {
        return Math.round((x - this.getLineCenterBaseX(line) - line.speed * line.dir * clock) / line.slotWidth);
    },

    isSlotOccupied(stage, slotIndex) {
        for (const item of this.travelItems) {
            if (item.destroyed || item.finished) continue;
            if (item.stage !== stage) continue;
            if (item.slotIndexLine === slotIndex) return true;
        }
        return false;
    },

    getLine1FirstVisibleSlotIndex() {
        return Math.ceil((-this.lines.line1.speed * this.speedClock) / this.lines.line1.slotWidth);
    },

    getAutoDropChance() {
        if (this.autoDropMode === 1) return 1;
        if (this.autoDropMode === 2) return 0.58;
        return 0;
    },

    handleAutoDrop() {
        if (this.autoDropMode === 0) return;

        const slotIndex = this.getLine1FirstVisibleSlotIndex();
        if (slotIndex === this.autoDropCheckSlot) return;
        this.autoDropCheckSlot = slotIndex;

        if (!this.autoDropSelectedKey) return;

        const btn = this.pillowButtons && this.pillowButtons[this.autoDropSelectedKey];
        if (!btn) return;
        if (Math.random() > this.getAutoDropChance()) return;

        this.placeLine1Pillow(btn._baseColor, btn._mult);
    },

    placeLine1Pillow(color, multiplier) {
        const slotIndex = this.getLine1FirstVisibleSlotIndex();
        const cost = this.bet * multiplier;
        if (this.balance < cost) return false;
        if (this.line1Pillows.has(slotIndex)) return false;

        const pillow = this.createTravelPillow(color, cost, multiplier, this.bet);
        pillow.slotIndex = slotIndex;
        pillow.stage = 1;

        this.line1Pillows.set(slotIndex, pillow);
        this.pillowLayer.add(pillow.container);

        this.balance -= cost;
        this.updatePillowButtonLabels();
        return true;
    },

    computeNextEggSpawnClock(dropXGetter, fromClock, first = false) {
        const line = this.lines.line1;
        const slotTravel = line.slotWidth / line.speed;
        const dropX = dropXGetter();
        const a = (dropX - (line.startX + line.slotWidth * 0.5) - line.speed * fromClock) / line.slotWidth;
        let dt = (a - Math.floor(a)) * slotTravel;

        const minLead = first ? 0.34 : 0.22;
        while (dt < minLead) dt += slotTravel;

        dt += Phaser.Math.Between(4, 7) * slotTravel;
        return fromClock + dt;
    },

    fallDuration() {
        return (this.eggLandingY - this.eggStartY) / 1050;
    },

    spawnEgg(dropX, targetClock) {
        const line = this.lines.line1;
        const slotIndex = Math.round(
            (dropX - (line.startX + line.slotWidth * 0.5) - line.speed * targetClock) / line.slotWidth
        );
        const eggType = this.chooseEggType();
        const visual = this.createEggVisual(eggType, true);

        visual.slotIndexAtLanding = slotIndex;
        visual.spawnClock = targetClock - this.fallDuration();
        visual.state = "falling";
        visual.typeData = eggType;
        visual.container.x = dropX;
        visual.container.y = this.eggStartY;

        this.eggLayer.add(visual.container);
        this.fallingEggs.push(visual);
    },

    handleEggSpawns() {
        while (this.speedClock >= this.nextEggSpawnA - this.fallDuration()) {
            this.spawnEgg(this.dropperAX, this.nextEggSpawnA);
            this.nextEggSpawnA = this.computeNextEggSpawnClock(() => this.dropperAX, this.nextEggSpawnA);
        }

        while (this.speedClock >= this.nextEggSpawnB - this.fallDuration()) {
            this.spawnEgg(this.dropperBX, this.nextEggSpawnB);
            this.nextEggSpawnB = this.computeNextEggSpawnClock(() => this.dropperBX, this.nextEggSpawnB);
        }
    },

    updateFallingEggs() {
        const duration = this.fallDuration();

        for (const egg of this.fallingEggs) {
            if (egg.state !== "falling") continue;
            const p = Phaser.Math.Clamp((this.speedClock - egg.spawnClock) / duration, 0, 1);
            egg.container.y = Phaser.Math.Linear(this.eggStartY, this.eggLandingY, p);

            if (p < 1) continue;
            const pillow = this.line1Pillows.get(egg.slotIndexAtLanding);

            if (pillow) {
                egg.state = "saved";
                pillow.eggs.push(egg.typeData);
                pillow.eggMultSum += egg.typeData.mult;
                pillow.currentValue += pillow.spentCost * egg.typeData.mult;
                if (egg.typeData.armored) {
                    pillow.armored = true;
                    pillow.permanentTextColor = "#d8e3ef";
                }
                egg.container.removeFromDisplayList();
                pillow.container.add(egg.container);

                if (pillow.eggs.length === 1) {
                    egg.container.x = 0;
                } else {
                    const prevEggContainer = pillow.container.list[pillow.container.length - 2];
                    prevEggContainer.x = -10;
                    egg.container.x = 10;
                }

                egg.container.y = -26;
                egg.container._eggTypeData = egg.typeData;
                this.updatePillowValueText(pillow);
            } else {
                egg.state = "dead";
                this.spawnEggSplatFx(
                    egg.container.x,
                    this.eggLandingY - 8,
                    this.lines.line1.y + this.lines.line1.h * 0.5 - 6
                );
                this.tweens.add({
                    targets: egg.container,
                    alpha: 0,
                    y: egg.container.y + 16,
                    duration: 150,
                    onComplete: () => egg.container.destroy()
                });
            }
        }

        this.fallingEggs = this.fallingEggs.filter(e => e.state === "falling");
    },

    updateLine1Items() {
        const line = this.lines.line1;
        const toDelete = [];

        this.line1Pillows.forEach((pillow, slotIndex) => {
            const x = line.startX + line.slotWidth * 0.5 + slotIndex * line.slotWidth + line.speed * this.speedClock;
            const y = line.y + line.h * 0.5 - 10;
            pillow.container.x = x;
            pillow.container.y = y;

            if (x >= this.transferRightFromX && pillow.eggs.length > 0) {
                this.moveItemToLine2(pillow);
                toDelete.push(slotIndex);
            } else if (x >= line.endX + line.slotWidth * 1.5) {
                if (!pillow.settled && pillow.eggs.length === 0) {
                    this.addLose(pillow.spentCost || 0);
                    pillow.settled = true;
                }
                pillow.container.destroy();
                toDelete.push(slotIndex);
            }
        });

        for (const key of toDelete) {
            this.line1Pillows.delete(key);
        }
    },

    moveItemToLine2(pillow) {
        pillow.stage = 121;
        pillow.x = this.transferRightFromX;
        pillow.y = this.lines.line1.y + this.lines.line1.h * 0.5 - 10;
        pillow.transferTargetX = this.transferRightToX;
        pillow.transferTargetY = this.lines.line2.y + this.lines.line2.h * 0.5 - 10;
        pillow.queueId = ++this.transferQueueSeq;
        pillow.queueLane = "right";
        pillow.container.x = pillow.x;
        pillow.container.y = pillow.y;
        this.travelItems.push(pillow);
    },

    moveItemToLine3(item) {
        item.stage = 231;
        item.x = this.transferLeftFromX;
        item.y = this.lines.line2.y + this.lines.line2.h * 0.5 - 10;
        item.transferTargetX = this.transferLeftToX;
        item.transferTargetY = this.lines.line3.y + this.lines.line3.h * 0.5 - 10;
        item.queueId = ++this.transferQueueSeq;
        item.queueLane = "left";
        item.container.x = item.x;
        item.container.y = item.y;
    },

    computeNextMachineImpactClock(def, line, stage, fromClock, first = false) {
        const slotTravel = line.slotWidth / line.speed;
        const baseX = line.startX + line.slotWidth * 0.5;
        const signedSpeed = line.speed * line.dir;
        const a = (def.container.x - baseX - signedSpeed * fromClock) / line.slotWidth;
        const frac = a - Math.floor(a);
        let dt = line.dir === 1 ? frac * slotTravel : ((1 - frac) % 1) * slotTravel;

        const minLead = first ? 0.14 : 0.05;
        while (dt < minLead) dt += slotTravel;

        let minSkip = 1;
        let maxSkip = 3;
        if (def.type === "half") {
            maxSkip = 2;
        } else if (def.type === "water") {
            maxSkip = 4;
        } else if (def.type === "fire") {
            minSkip = 0;
            maxSkip = 1;
        } else if (def.rarity === "gold") {
            minSkip = def.fastGold ? 5 : 6;
            maxSkip = def.fastGold ? 10 : 12;
        }

        dt += Phaser.Math.Between(minSkip, maxSkip) * slotTravel;
        return fromClock + dt;
    },

    getMachineFlightTime(def, line) {
        const startY = def.container.y + 36;
        const endY = line.y + line.h * 0.5 - 6;
        return Math.max(0.17, (endY - startY) / 1050);
    },

    getStageItems(stage) {
        if (stage === 1) {
            const items = [];
            this.line1Pillows.forEach((pillow, slotIndex) => {
                if (pillow.destroyed || pillow.finished) return;
                pillow.slotIndexLine = slotIndex;
                pillow.stage = 1;
                items.push(pillow);
            });
            return items;
        }
        return this.travelItems.filter(item => !item.destroyed && !item.finished && item.stage === stage);
    },

    maybeFireMachine(def, line, stage) {
        const schedule = (fromClock, first) => {
            const flight = this.getMachineFlightTime(def, line);
            const impact = this.computeNextMachineImpactClock(def, line, stage, fromClock + flight, first);
            const desync = (def.type === "fire" && stage === 3) ? def.shotDesync : 0;
            def.nextShot = impact - flight + desync;
            def.nextImpact = impact;
            def.flightTime = flight;
        };

        if (!def.nextShot || def.nextShot < this.speedClock - 5) schedule(this.speedClock, true);
        if (this.speedClock < def.nextShot) return;

        if (def.type === "fire" && stage === 3 && Math.random() < def.fireSkipChance) {
            const delay = Phaser.Math.FloatBetween(0.06, 0.48) * def.fireChaosJitter;
            schedule(this.speedClock + delay, false);
            return;
        }

        this.spawnVerticalProjectile(def, line, stage, def.nextImpact, def.flightTime);
        schedule(def.nextImpact, false);
    },

    spawnVerticalProjectile(def, line, stage, impactClock, flightTime) {
        const startX = def.container.x;
        const startY = def.container.y + 36;
        const centerIndex = this.getNearestLineSlotIndex(line, startX, impactClock);
        const endX = this.getLineSlotCenterXAtClock(line, centerIndex, impactClock);
        const endY = line.y + line.h * 0.5 - 6;
        const travelDuration = Math.round((flightTime || this.getMachineFlightTime(def, line)) * 1000);

        let color = 0xaab7c8;
        if (def.type === "water") color = 0x59b7ff;
        else if (def.type === "fire") color = 0xe34932;
        else if (def.rarity === "gold") color = 0xe3cf47;

        const shot = this.add.rectangle(startX, startY, 14, 14, color, 1)
            .setStrokeStyle(2, 0xffffff, 0.55)
            .setDepth(5000);
        this.fxLayer.add(shot);

        this.tweens.add({
            targets: shot,
            x: endX,
            y: endY,
            duration: travelDuration,
            angle: 180,
            ease: "Sine.In",
            onComplete: () => {
                const items = this.getStageItems(stage);
                const item = items.find(entry => entry.slotIndexLine === centerIndex)
                    || items.find(entry => Math.abs(entry.x - endX) <= line.slotWidth * 0.28);
                shot.destroy();
                if (item) this.applyMachineEffect(def, item);
                this.spawnImpactFx(endX, endY, color);
            }
        });
    },

    applyMachineEffect(def, item) {
        if (item.destroyed || item.finished) return;

        if (def.type === "water") {
            item.wet = true;
            this.ensureWetFx(item);
            this.flashValueText(item, "#7fc8ff");
            this.spawnWaterEggSplash(item);
            this.pulseItem(item);
            return;
        }

        if (def.type === "half") {
            item.eggMultSum *= 0.5;
            item.currentValue *= 0.5;
            this.updatePillowValueText(item);
            this.flashValueText(item, "#ff6d6d");
            this.pulseItem(item);
            return;
        }

        if (def.type === "mul") {
            item.eggMultSum *= def.value;
            item.currentValue *= def.value;
            if (def.rarity === "gold") item.permanentTextColor = "#f1cb4a";
            this.updatePillowValueText(item);
            this.flashValueText(item, def.rarity === "gold" ? "#fff2a3" : "#7dff9c");
            this.pulseItem(item);
            return;
        }

        if (def.type === "fire") {
            if (item.wet) {
                item.wet = false;
                this.clearWetFx(item);
                this.updatePillowValueText(item);
                this.spawnImpactFx(item.container.x, item.container.y - 4, 0x59b7ff);
                this.spawnDryFx(item);
                this.pulseItem(item);
                return;
            }

            const armoredEggs = (item.eggs || []).filter(egg => egg.armored);
            const vulnerableEggs = (item.eggs || []).filter(egg => !egg.armored);

            if (armoredEggs.length > 0 && vulnerableEggs.length === 0) {
                this.flashValueText(item, "#d8e3ef");
                this.spawnImpactFx(item.container.x, item.container.y - 6, 0xc8d0db);
                this.pulseItem(item);
                return;
            }

            if (armoredEggs.length > 0 && vulnerableEggs.length > 0) {
                item.eggs = armoredEggs;
                item.armored = true;
                item.eggMultSum *= 0.5;
                item.currentValue *= 0.5;
                item.permanentTextColor = "#d8e3ef";

                const remainingEggContainers = [];
                for (const child of item.container.list.slice()) {
                    if (!child || !child._eggTypeData) continue;
                    if (child._eggTypeData.armored) {
                        remainingEggContainers.push(child);
                        continue;
                    }
                    child.destroy();
                }

                if (remainingEggContainers.length === 1) {
                    remainingEggContainers[0].x = 0;
                } else if (remainingEggContainers.length > 1) {
                    remainingEggContainers.forEach((entry, index) => {
                        entry.x = index === 0 ? -10 : 10;
                    });
                }

                this.updatePillowValueText(item);
                this.flashValueText(item, "#ffb36b");
                this.spawnImpactFx(item.container.x, item.container.y - 6, 0xff7a45);
                this.pulseItem(item);
                return;
            }

            item.destroyed = true;
            this.clearWetFx(item);
            if (!item.settled) {
                this.addLose(item.spentCost || 0);
                item.settled = true;
            }

            const fire = this.add.circle(item.container.x, item.container.y - 8, 34, 0xff5b39, 0.35).setDepth(5100);
            this.fxLayer.add(fire);
            this.tweens.add({
                targets: item.container,
                alpha: 0,
                angle: 15,
                duration: 220,
                onComplete: () => item.container.destroy()
            });
            this.tweens.add({
                targets: fire,
                scaleX: 2.4,
                scaleY: 2.4,
                alpha: 0,
                duration: 220,
                onComplete: () => fire.destroy()
            });
        }
    },

    handleMachineLogic() {
        for (const def of this.line1Machines) this.maybeFireMachine(def, this.lines.line1, 1);
        for (const def of this.line2Machines) this.maybeFireMachine(def, this.lines.line2, 2);
        for (const def of this.line3Machines) this.maybeFireMachine(def, this.lines.line3, 3);
    },

    isLiftBusy(lane) {
        const activeStages = lane === "right" ? [12, 122] : [23, 232];
        return this.travelItems.some(item => !item.destroyed && !item.finished && activeStages.includes(item.stage));
    },

    isFirstInLiftQueue(item, lane) {
        const waitStage = lane === "right" ? 121 : 231;
        let minId = Infinity;
        for (const t of this.travelItems) {
            if (t.destroyed || t.finished || t.stage !== waitStage) continue;
            minId = Math.min(minId, t.queueId || Infinity);
        }
        return (item.queueId || Infinity) === minId;
    },

    stepTransferItem(item, dt, speed) {
        const dx = item.transferTargetX - item.x;
        const dy = item.transferTargetY - item.y;
        const dist = Math.hypot(dx, dy);
        const step = speed * dt;

        if (dist <= step || dist < 0.5) {
            item.x = item.transferTargetX;
            item.y = item.transferTargetY;
            return true;
        }

        const k = step / dist;
        item.x += dx * k;
        item.y += dy * k;
        return false;
    },

    updateTravelItems(dt) {
        const alive = [];
        const transferSpeed = 520 * this.getTurboMultiplier();

        for (const item of this.travelItems) {
            if (item.destroyed || item.finished) continue;

            if (item.stage === 121) {
                if (!this.isLiftBusy("right") && this.isFirstInLiftQueue(item, "right")) {
                    item.stage = 12;
                } else {
                    const order = Math.max(0, this.travelItems.filter(t => !t.destroyed && !t.finished && t.stage === 121 && (t.queueId || 0) < (item.queueId || 0)).length);
                    item.x = this.transferRightFromX;
                    item.y = this.lines.line1.y + this.lines.line1.h * 0.5 - 10 + order * 20;
                    item.container.x = item.x;
                    item.container.y = item.y;
                    alive.push(item);
                    continue;
                }
            }

            if (item.stage === 12) {
                const arrived = this.stepTransferItem(item, dt, transferSpeed);
                item.container.x = item.x;
                item.container.y = item.y;
                if (arrived) {
                    item.stage = 122;
                    item.x = item.transferTargetX;
                    item.y = item.transferTargetY;
                    item.container.x = item.x;
                    item.container.y = item.y;
                }
                alive.push(item);
                continue;
            }

            if (item.stage === 122) {
                const entrySlot = this.getNearestLineSlotIndex(this.lines.line2, item.transferTargetX);
                const centerX = this.getLineSlotCenterXAtClock(this.lines.line2, entrySlot);
                item.x = item.transferTargetX;
                item.y = item.transferTargetY;
                item.container.x = item.x;
                item.container.y = item.y;
                if (Math.abs(centerX - item.transferTargetX) <= 1.2 && !this.isSlotOccupied(2, entrySlot)) {
                    item.stage = 2;
                    item.slotIndexLine = entrySlot;
                    item.x = centerX;
                    item.y = this.lines.line2.y + this.lines.line2.h * 0.5 - 10;
                    item.holdUntilClock = this.speedClock + 0.02;
                    item.container.x = item.x;
                    item.container.y = item.y;
                }
                alive.push(item);
                continue;
            }

            if (item.stage === 2) {
                if (this.speedClock >= (item.holdUntilClock || 0)) {
                    item.x = this.getLineSlotCenterXAtClock(this.lines.line2, item.slotIndexLine);
                }
                item.container.x = item.x;
                item.container.y = item.y;
                if (item.x <= this.transferLeftFromX) this.moveItemToLine3(item);
                alive.push(item);
                continue;
            }

            if (item.stage === 231) {
                if (!this.isLiftBusy("left") && this.isFirstInLiftQueue(item, "left")) {
                    item.stage = 23;
                } else {
                    const order = Math.max(0, this.travelItems.filter(t => !t.destroyed && !t.finished && t.stage === 231 && (t.queueId || 0) < (item.queueId || 0)).length);
                    item.x = this.transferLeftFromX;
                    item.y = this.lines.line2.y + this.lines.line2.h * 0.5 - 10 + order * 20;
                    item.container.x = item.x;
                    item.container.y = item.y;
                    alive.push(item);
                    continue;
                }
            }

            if (item.stage === 23) {
                const arrived = this.stepTransferItem(item, dt, transferSpeed);
                item.container.x = item.x;
                item.container.y = item.y;
                if (arrived) {
                    item.stage = 232;
                    item.x = item.transferTargetX;
                    item.y = item.transferTargetY;
                    item.container.x = item.x;
                    item.container.y = item.y;
                }
                alive.push(item);
                continue;
            }

            if (item.stage === 232) {
                const entrySlot = this.getNearestLineSlotIndex(this.lines.line3, item.transferTargetX);
                const centerX = this.getLineSlotCenterXAtClock(this.lines.line3, entrySlot);
                item.x = item.transferTargetX;
                item.y = item.transferTargetY;
                item.container.x = item.x;
                item.container.y = item.y;
                if (Math.abs(centerX - item.transferTargetX) <= 1.2 && !this.isSlotOccupied(3, entrySlot)) {
                    item.stage = 3;
                    item.slotIndexLine = entrySlot;
                    item.x = centerX;
                    item.y = this.lines.line3.y + this.lines.line3.h * 0.5 - 10;
                    item.holdUntilClock = this.speedClock + 0.02;
                    item.container.x = item.x;
                    item.container.y = item.y;
                }
                alive.push(item);
                continue;
            }

            if (item.stage === 3) {
                if (this.speedClock >= (item.holdUntilClock || 0)) {
                    item.x = this.getLineSlotCenterXAtClock(this.lines.line3, item.slotIndexLine);
                }
                item.container.x = item.x;
                item.container.y = item.y;

                if (item.x >= this.lines.line3.endX + this.lines.line3.slotWidth * 0.5) {
                    item.finished = true;
                    this.clearWetFx(item);
                    this.balance += item.currentValue || 0;
                    this.addWin(item.currentValue || 0);
                    if (!item.settled && (item.currentValue || 0) < (item.spentCost || 0)) {
                        this.addLose((item.spentCost || 0) - (item.currentValue || 0));
                    }
                    item.settled = true;
                    this.updatePillowButtonLabels();
                    this.spawnImpactFx(this.W - 16, item.y, 0x63ff8d);
                    this.showCenterWin(item.currentValue || 0);
                    item.container.destroy();
                    continue;
                }

                alive.push(item);
            }
        }

        this.travelItems = alive;
    }
};
