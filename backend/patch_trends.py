"""Rewrite lines 109-end of trends.py intelligence endpoint"""

path = 'app/api/endpoints/trends.py'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Keep everything up to line 109 (0-indexed: 108), then replace the rest
keep = lines[:108]  # Lines 1-109 (mat_str assignment line)

new_tail = '''
        # 2. Groq AI suggestion — isolated so live DB material data is ALWAYS returned
        ai_suggestion = {
            "title": "Artisan AI Suggestion",
            "subtitle": "Market Optimization Tip",
            "text": f"Based on live data, plan purchases wisely: {mat_str[:100]}",
            "action": "Calculate Potential Profit",
        }
        try:
            api_key = settings.GROQ_API_KEY
            client = AsyncGroq(api_key=api_key)
            prompt = (
                "You are an AI analyst for Indian artisans. "
                f"Live supply costs: {mat_str}. "
                'Return JSON with key "ai_suggestion": {title, subtitle, text (1 localized 20-word profit tip), action}.'
            )
            completion = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.7,
            )
            groq_data = json.loads(completion.choices[0].message.content)
            ai_suggestion = groq_data.get("ai_suggestion", ai_suggestion)
        except Exception as groq_err:
            logger.warning(f"Groq AI failed, using data-driven fallback: {groq_err}")

        return {
            "ai_suggestion": ai_suggestion,
            "material_forecast": material_forecast,
        }

    except Exception as e:
        logger.error(f"Intelligence endpoint DB error: {e}")
        return {
            "ai_suggestion": {
                "title": "Artisan AI Suggestion",
                "subtitle": "Service temporarily unavailable",
                "text": "Market data is loading. Please check back shortly.",
                "action": "Retry",
            },
            "material_forecast": [
                {"name": "Service Unavailable", "price": "\u2014", "status": "Retry shortly", "trend": "\u2192"}
            ],
        }
'''

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(keep)
    f.write(new_tail)

print(f"SUCCESS: Rewrote lines 109-end. Total lines now: {len(keep) + len(new_tail.splitlines())}")
