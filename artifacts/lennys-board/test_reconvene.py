import requests, json                                                                                                                                                                                               

resp = requests.post(                                                                                                                                                                                               
    "https://12cbdf61-99c3-4841-b021-3a1906db9180-00-1l75k0vkpkzym.pike.replit.dev/reconvene",
    verify=False,
    json={                                                                                                                                                                                                          
        "problem": "Should we build a freemium tier or stay fully paid?",
        "board": [                                                                                                                                                                                                  
            {"guest_name": "Elena Verna", "role": "The Challenger", "episode_title": "Growth"},
            {"guest_name": "Shreyas Doshi", "role": "The Operator", "episode_title": "Prioritization"},                                                                                                             
            {"guest_name": "Julie Zhuo", "role": "The Visionary", "episode_title": "Design"},
            {"guest_name": "Gibson Biddle", "role": "The User Advocate", "episode_title": "Product"},                                                                                                               
            {"guest_name": "Ethan Smith", "role": "The Data Oracle", "episode_title": "Metrics"}
        ],                                                                                                                                                                                                          
        "responses": [
            "Freemium is a distribution strategy, not a revenue strategy.",                                                                                                                                         
            "Execution risk of freemium is underestimated — support load doubles.",
            "The real question is whether free users become evangelists.",
            "Users need to feel the value before they pay for it.",                                                                                                                                                 
            "Your conversion data will tell you if freemium is worth it."
        ],                                                                                                                                                                                                          
        "synthesis": {
            "agrees": "The board agrees the decision hinges on whether free users convert.",
            "tension": "Elena wants freemium as growth lever; Shreyas says execution cost kills it.",                                                                                                               
            "next_move": "Run a 60-day freemium pilot with a hard conversion gate at day 30."
        },                                                                                                                                                                                                          
        "follow_up": "How do we decide the right conversion trigger point?"
    }                                                                                                                                                                                                               
)
print(json.dumps(resp.json(), indent=2)) 