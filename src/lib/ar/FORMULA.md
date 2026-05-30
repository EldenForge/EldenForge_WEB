# Calcul de l'Attack Rating (Elden Ring) — formule erdb

Source : [erdb v1.10.0](https://github.com/EldenRingDatabase/erdb) (MIT), params officiels du jeu.

## Formule

Pour chaque type de degat `D` parmi `phy, mag, fir, lit, hol` :

```
AR_D = base_atk[D] * (1 + scalingContribution_D)

scalingContribution_D = sum over A in {Str, Dex, Int, Fai, Arc} of:
    correction[aec_id][D][A] ? (
        scaling[A]                          // weapons[name].scaling[A], deja /100
        * graph[graph_ids[D]][stat[A]]      // correction_graphs[id], index = valeur stat
        * ratio[aec_id][D][A]               // influence, defaut 1.0
    ) : 0
```

`stat[A]` est la stat du joueur (clamp 1..149). `base_atk` est `weapons[name].base_atk[D]` au +0. Pour un niveau d'upgrade `+L`, multiplier `base_atk[D]` par `reinforcements[reinforceTypeId + L][D]` et `scaling[A]` par `reinforcements[...][scale_A]`. Si `override[A]` existe pour `D`, remplacer `scaling[A]` par `override[A]` (rare, sorcieres + catalysts).

AR total visible en jeu = `floor(AR_phy) + floor(AR_mag) + ...` (chaque composante arrondie a l'entier).

## Lettres -> floats

Le front a des scalings en lettres (S/A/B/C/D/E) issues de Fextralife. Mapping fallback dans `letter_multipliers` (S=1.75, A=1.55, B=1.10, C=0.75, D=0.45, E=0.15, "-"=0). Si possible, prendre directement le float exact via `weapons[name].scaling[A]` (extrait du gamedata) — c'est ce qu'utilise erdb.

## Exemple chiffre — Longsword +0, Str=20, Dex=15

- `weapons["longsword"].base_atk.phy = 110`
- `scaling = { Str: 0.5, Dex: 0.33, Int: 0, Fai: 0, Arc: 0 }`
- `graph_ids.phy = 0` (graph "Default")
- `attackElementCorrectId = 10000` -> pour phy : `correction = {Str:true, Dex:true, Int:false, Fai:false, Arc:false}`, `ratio = {Str:1, Dex:1, ...}`
- `correction_graphs["0"][20] = 0.278434`, `correction_graphs["0"][15] = 0.198041`

Contributions :
- Str : `0.5 * 0.278434 * 1.0 = 0.13922`
- Dex : `0.33 * 0.198041 * 1.0 = 0.06535`
- Int/Fai/Arc : 0 (correction=false)
- Somme = `0.20457`

`AR_phy = 110 * (1 + 0.20457) = 132.50` -> affiche **133**.

## Caveats

- Donnees jusqu'a patch 1.10 inclus. Aucune arme DLC Shadow of the Erdtree. Pour une arme DLC, fallback : graph_id `0` (Default) + scaling.Str/Dex en float estime via `letter_multipliers`.
- `weapons` ne contient QUE les armes "Standard" affinity 0 +0. Pour autres affinites (Heavy, Keen, etc.), il faudrait charger les rows offset par +100/+200 (`affinity = round(offset/100)`) — non inclus pour garder le JSON leger.
- Les graphs 12..16 (Catalyst*) ne servent que pour les sorts/incantations, pas pour l'AR d'arme melee.
- Les status effects (saignement, gel...) suivent une logique differente non couverte ici.
