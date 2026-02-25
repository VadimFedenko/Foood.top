# Data & Methodology

Before we talk about data, here’s the most **important** part: you don’t have to agree with any of it — the app is fully customizable. The data is just a starting point.
You can give dishes your own scores (press **I’ve tasted it! [Edit Rating]** in **Score Breakdown**). Your overrides are saved locally on your device.
Hate oatmeal → rate its taste 0/10. It will drop to the very bottom.

How do we calculate the scores?

<details>
<summary><strong><span data-icon="cost"></span> Cheapness</strong></summary>

Prices are calculated automatically from recipes, using ingredient prices from an aggregated database *(multiple sources were used to cover all of products: Tridge, IMF, Numbeo, GlobalProductPrices).*

*   **Yield coefficient:** We account for waste (e.g., avocado pits).
*   **Index map:** The “Index Map” tab breaks down cooking cost around the world. It’s like the Big Mac Index, but computed for any specific dish.
</details>

<details>
<summary><strong><span data-icon="health"></span> Health</strong></summary>

For the health score, we prioritized Cochrane systematic reviews. If there was no Cochrane review for a product, we moved down the evidence hierarchy: meta-analyses, randomized controlled trials, then cohort studies, and so on.

Then we normalize the result: 10 for the absolute best foods (those associated with longevity) and 0 for the absolute worst (those that actively promote disease).

*  0–2: **Unhealthy.** Trans fats, excessive sugar, preservatives.
*  3–6: **Neutral/Mixed.** Red meat (good protein but saturated fat), white rice, pasta.
*  7–8: **Healthy.** Eggs, arugula, nuts, lean poultry.
*  9–10: **Superfoods.** Broccoli, berries, omega-3, extra-virgin olive oil, turmeric.

Each ingredient’s score was assigned by Gemini 3 Pro based on analysis of scientific evidence.

Then ingredients get a penalty depending on the cooking method used in a specific dish.

The final health score of a dish depends on the average health score of its ingredients. You can see the breakdown in the dish card.

</details>

<details>
<summary><strong><span data-icon="speed"></span> Time</strong></summary>

I collected a recipe database and averaged typical active prep and cooking time. The final score is based on a percentile: *for example, the 85th percentile by speed (faster than 85% of dishes) = 85 points out of 100*.

The dish also receives a penalty for a long passive cooking phase.

The app has an **Optimized Time** mode: if you cook something regularly, you’ll quickly learn to do it faster.
Optimized time is meant to reflect that. It also accounts for portioning: *an omelet is fast, but if you make two portions at once, it becomes (almost) twice as fast*.
</details>

<details>
<summary><strong><span data-icon="taste"></span> Taste</strong></summary>

The app includes multiple approaches to taste scoring:

*  Sentiment analysis of reviews from Yelp/Amazon Food Reviews. Dishes that polarize people get fewer points. Downside: for some dishes, there are too few reviews to average reliably.
*  A “polarization” score from Gemini 3 Flash Thinking. Downside: even if the model output is statistically likely, it’s still hard to call it objective.
*  I also considered aggregating ratings from third-party services, but that would require an online connection. It would be tempting to use TasteAtlas.

</details>

<details>
<summary><strong><span data-icon="ethics"></span> Ethics score</strong></summary>

Ethics is deeply subjective. We use the following arbitrary criteria (primarily animal suffering, labor conditions, and pollution).

Scale:
* 0: >1 animal death per item AND heavy pollution (e.g., factory-farmed shrimp, foie gras).
* 1: Killing animals (factory farming) without heavy chemical pollution.
* 2: Killing 1 large animal yields many portions (e.g., beef), but still slaughter.
* 3: Animal suffering without slaughter (e.g., caged egg hens, dairy cows in poor conditions).
* 4: Animals not killed, conditions are poor/crowded but not torture.
* 5: Animals exploited (labour/products) in decent conditions OR non-animal product with some pollution issues.
* 6: Non-animal, but heavy industrial pollution/water usage (e.g., almonds in drought areas, avocados with cartel involvement).
* 7–9: Plant-based, varying degrees of sustainability (7 = monocultures, 9 = organic/regenerative).
* 10: Absolute purity. No suffering, carbon negative or neutral, wild-harvested or perfectly sustainable (e.g., locally grown organic lentils, wild berries).

*The scoring by these criteria was done by ChatGPT-OSS and Gemini 3.0 Flash Thinking, then averaged. Details for each dish are available in the ethics slide.*
</details>

<details>
<summary><strong>List of economic zones</strong></summary>

1. **Eastern Euro Agrarian**
Largest producers of grains, oils, and root crops with low labor costs — the cheapest basic calories in Europe.
2. **Western EU Industrial**
High meat taxes, expensive organic food due to high wages; cheap processing (cheese, chocolate) thanks to farm subsidies.
3. **Northern Import**
Cold climate, lack of land — everything is expensive except local fish; imports have a huge logistics markup.
4. **Mediterranean**
“Europe’s garden” with 2–3 harvests per year — cheap vegetables, fruit, olive oil, wine.
5. **North American**
Intensive industrial farming (GMOs, hormones) — cheap beef, poultry, fast-food ingredients; expensive organic.
6. **LatAm Agrarian**
The world’s “meat shop” with vast pastures — extremely cheap beef, coffee, tropical fruit.
7. **Asian Rice/Labor**
Labor-intensive agriculture — cheap rice, pork, vegetables, greens; little dairy culture.
8. **Developed Asia**
Island nations with limited land — everything is expensive; fruit sold by the piece; meat is premium.
9. **MENA Arid**
Desert climate, imports paid with oil money — cheap dates, lamb (subsidies), expensive vegetables.
10. **Oceanic Remote**
Expensive sea logistics — imported goods with markups, except local seafood and coconuts.
11. **Sub-Saharan Subsistence**
Subsistence farming — cassava, millet almost free; any import/processing (cheese, canned goods) is a luxury.
</details>