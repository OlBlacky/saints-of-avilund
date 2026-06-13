---
title: Combat
summary: The turn and its actions, how attacks are resolved, and the rules for falling, dying, and recovering.
---

> *A first draft — the turn and attack rules are settled in the design notes; falling and recovery are written up in full below.*

## The turn

On your turn you have, to spend in any order:

- **1 Standard**, **1 Move**, **1 Minor**, and any number of **Free** actions.
- You may always trade **down** the chain: a Standard can become a Move or a Minor; a Move can become a Minor.
- Outside your turn you get **one Interrupt *or* one Reaction** — the two share a slot — unless an ability grants more.

## Making an attack

An attack rolls **d20 + your Offense vs the target's Defense** — meet or beat it to hit. There is **no advantage or disadvantage**; every modifier is a flat number.

- Each attribute has an **Offense** (your bonus to hit with attacks keyed off it) and two **Defenses** — an **Unarmoured** and an **Armoured** value. Armour raises the Armoured ones.
- Most physical attacks target **AC** *(your Armoured Constitution Defense)*; magic that bypasses armour strikes an **Unarmoured** defense instead.
- Ranged attacks lose nothing in the first range band, **−2** in the second, **−4** in the third.

## Falling, dying, and death

When you are reduced to **0 HP or lower** you fall **unconscious** and gain the **Dying** condition. At **−10 HP** you are dead.

- While Dying, at the **start of each of your turns** you may attempt to **self-stabilize**: a **Constitution save**, **DC = 10 + how far below 0 you are** *(−4 HP → DC 14)*. Succeed, and you stop dying.
- Others can stabilize you with the right ability, or a **Heal check** at that same DC.

Once stabilized, you gain the **Wounded** condition.

### The Wounded condition

Wounded **stacks** — each time you are dropped and revived, its Rank rises *(down, up, down again = Wounded 2)*. **Per Rank**, it imposes:

- **−5 Speed**, **−1 to all offences**, **−1 to all defences**, and **−2 to your Maximum HP**.

Wounds are **not** shrugged off mid-fight — only rare, powerful magic does that, and certain trained healers *(the Physician's **Convalescence**, the Friar's **Vigil**)*.

## Healing and recovery

**Natural healing.** You recover **1 HP per day** while active, **2 HP per day** on full bed rest.

**Recovering from Wounds.** Absent a special ability, after **7 days** you roll **Heal or Constitution** *(whichever is better)*, **once per Wound**, to shed it:

| Conditions | Save DC | Supplies |
|---|---|---|
| Bed rest, attended by a healer | 11 + Wound Rank | 3 / wound |
| Active, attended | 16 + Wound Rank | 7 / wound |
| Bed rest, no attendant | 15 + Wound Rank | — *(a natural 1 worsens the Wound)* |
| Active, no attendant | 18 + Wound Rank | — *(a natural 1 worsens the Wound)* |

## Ability-score damage

Dire foes and curses can **drain attribute scores** — a Wrath that saps Constitution, a hex that gnaws at the mind. Unless the source says otherwise, the damage can mend on its own: after **7 days**, a **Constitution check** *(for Str/Dex/Con)* or **Wisdom check** *(for Int/Wis/Cha)* against the **hazard's DC** restores **1 point**.

- **Full bed rest** lowers that DC by **5**.
- An **attendant** with the **Heal** skill may roll Heal in place of the save, spending **3 Supplies** *(rested)* or **7** *(active)*.
- The **Physician** treats the physical three, the **Friar** the mental three — each far faster than nature alone.
