#!/usr/bin/env python3
"""
Pre-generates Magic English Stage 1 NPC & Word/Phrase MP3 files using ElevenLabs TTS API.
Follows the exact Voice IDs, models, and voice_settings from Funny Farming:
- Bill (pqHfZKP75CvOlQylNhV4): Airport Staff, Traveler, Mr. Misspell
- Fena (BlgEcC0TfWpBak7FmvHW): Amy, Ringo, Hwalbin, Word/Phrase Listen prompts
Reads ELEVENLABS_API_KEY from environment variable (never hardcoded in source).
"""
import json
import os
import sys
import urllib.request
import urllib.error

VOICE_BILL = "pqHfZKP75CvOlQylNhV4"
VOICE_FENA = "BlgEcC0TfWpBak7FmvHW"

BILL_SETTINGS = {
    "speed": 0.78,
    "stability": 0.72,
    "similarity_boost": 0.75,
    "style": 0.12,
    "use_speaker_boost": True,
}

FENA_SETTINGS = {
    "speed": 0.80,
    "stability": 0.80,
    "similarity_boost": 0.75,
    "style": 0.0,
    "use_speaker_boost": True,
}

FENA_SLOW_WORD_SETTINGS = {
    "speed": 0.75,
    "stability": 0.80,
    "similarity_boost": 0.75,
    "style": 0.0,
    "use_speaker_boost": True,
}

CLIPS = [
    # Word & Phrase Listen clips (Fena)
    {
        "id": "letter_a",
        "file": "letter_a.mp3",
        "voice_id": VOICE_FENA,
        "voice_name": "Fena",
        "model_id": "eleven_multilingual_v2",
        "settings": FENA_SETTINGS,
        "text": "The letter A. Capital A, small a.",
    },
    {
        "id": "word_airplane",
        "file": "word_airplane.mp3",
        "voice_id": VOICE_FENA,
        "voice_name": "Fena",
        "model_id": "eleven_multilingual_v2",
        "settings": FENA_SLOW_WORD_SETTINGS,
        "text": "Airplane.",
    },
    {
        "id": "sentence_airplane",
        "file": "sentence_airplane.mp3",
        "voice_id": VOICE_FENA,
        "voice_name": "Fena",
        "model_id": "eleven_multilingual_v2",
        "settings": FENA_SETTINGS,
        "text": "A is for Airplane.",
    },
    {
        "id": "word_apple",
        "file": "word_apple.mp3",
        "voice_id": VOICE_FENA,
        "voice_name": "Fena",
        "model_id": "eleven_multilingual_v2",
        "settings": FENA_SLOW_WORD_SETTINGS,
        "text": "Apple.",
    },
    {
        "id": "sentence_apple",
        "file": "sentence_apple.mp3",
        "voice_id": VOICE_FENA,
        "voice_name": "Fena",
        "model_id": "eleven_multilingual_v2",
        "settings": FENA_SETTINGS,
        "text": "A is for Apple.",
    },
    {
        "id": "word_ask",
        "file": "word_ask.mp3",
        "voice_id": VOICE_FENA,
        "voice_name": "Fena",
        "model_id": "eleven_multilingual_v2",
        "settings": FENA_SLOW_WORD_SETTINGS,
        "text": "Ask.",
    },
    {
        "id": "sentence_ask",
        "file": "sentence_ask.mp3",
        "voice_id": VOICE_FENA,
        "voice_name": "Fena",
        "model_id": "eleven_multilingual_v2",
        "settings": FENA_SETTINGS,
        "text": "Excuse me. Can I ask?",
    },
    {
        "id": "phrase_excuse_me",
        "file": "phrase_excuse_me.mp3",
        "voice_id": VOICE_FENA,
        "voice_name": "Fena",
        "model_id": "eleven_multilingual_v2",
        "settings": FENA_SLOW_WORD_SETTINGS,
        "text": "Excuse me.",
    },
    {
        "id": "phrase_can_i_ask",
        "file": "phrase_can_i_ask.mp3",
        "voice_id": VOICE_FENA,
        "voice_name": "Fena",
        "model_id": "eleven_multilingual_v2",
        "settings": FENA_SLOW_WORD_SETTINGS,
        "text": "Can I ask?",
    },
    # NPC Dialogue English Lines (Bill & Fena)
    {
        "id": "traveler_are_you_okay",
        "file": "traveler_are_you_okay.mp3",
        "voice_id": VOICE_BILL,
        "voice_name": "Bill",
        "model_id": "eleven_multilingual_v2",
        "settings": BILL_SETTINGS,
        "text": "Are you okay? What happened?",
    },
    {
        "id": "misspell_exit_tixe",
        "file": "misspell_exit_tixe.mp3",
        "voice_id": VOICE_BILL,
        "voice_name": "Bill",
        "model_id": "eleven_multilingual_v2",
        "settings": BILL_SETTINGS,
        "text": "Hehe! Upside down! Let's change EXIT to T-I-X-E!",
    },
    {
        "id": "amy_hello_gildong",
        "file": "amy_hello_gildong.mp3",
        "voice_id": VOICE_FENA,
        "voice_name": "Fena",
        "model_id": "eleven_flash_v2",
        "settings": FENA_SETTINGS,
        "text": "It's okay! Welcome to America. I am Amy! Let's find your friend together!",
    },
    {
        "id": "ringo_intro_a",
        "file": "ringo_intro_a.mp3",
        "voice_id": VOICE_FENA,
        "voice_name": "Fena",
        "model_id": "eleven_multilingual_v2",
        "settings": FENA_SETTINGS,
        "text": "Beep! Today's alphabet is A! A is for Airplane. A is for Apple.",
    },
    {
        "id": "amy_teach_ask",
        "file": "amy_teach_ask.mp3",
        "voice_id": VOICE_FENA,
        "voice_name": "Fena",
        "model_id": "eleven_multilingual_v2",
        "settings": FENA_SETTINGS,
        "text": "When you don't know, just ask! Say: Excuse me. Can I ask?",
    },
    {
        "id": "amy_try_again",
        "file": "amy_try_again.mp3",
        "voice_id": VOICE_FENA,
        "voice_name": "Fena",
        "model_id": "eleven_multilingual_v2",
        "settings": FENA_SETTINGS,
        "text": "It's okay to make mistakes! Try again! Excuse me. Can I ask?",
    },
    {
        "id": "staff_hello_help",
        "file": "staff_hello_help.mp3",
        "voice_id": VOICE_BILL,
        "voice_name": "Bill",
        "model_id": "eleven_multilingual_v2",
        "settings": BILL_SETTINGS,
        "text": "Hello! Can I help you?",
    },
    {
        "id": "staff_sure_help",
        "file": "staff_sure_help.mp3",
        "voice_id": VOICE_BILL,
        "voice_name": "Bill",
        "model_id": "eleven_multilingual_v2",
        "settings": BILL_SETTINGS,
        "text": "Sure! How can I help you?",
    },
    {
        "id": "gildong_my_friend_help",
        "file": "gildong_my_friend_help.mp3",
        "voice_id": VOICE_FENA,
        "voice_name": "Fena",
        "model_id": "eleven_multilingual_v2",
        "settings": FENA_SETTINGS,
        "text": "Excuse me. Can I ask? My friend! Help, please!",
    },
    {
        "id": "staff_friend_over_there",
        "file": "staff_friend_over_there.mp3",
        "voice_id": VOICE_BILL,
        "voice_name": "Bill",
        "model_id": "eleven_multilingual_v2",
        "settings": BILL_SETTINGS,
        "text": "Oh! Your friend is in the Lost and Found room right over there!",
    },
    {
        "id": "ringo_ding_correct",
        "file": "ringo_ding_correct.mp3",
        "voice_id": VOICE_FENA,
        "voice_name": "Fena",
        "model_id": "eleven_flash_v2",
        "settings": FENA_SETTINGS,
        "text": "Ding! Correct! You got the letter A piece! Good job!",
    },
    {
        "id": "hwalbin_help_thank_you",
        "file": "hwalbin_help_thank_you.mp3",
        "voice_id": VOICE_FENA,
        "voice_name": "Fena",
        "model_id": "eleven_flash_v2",
        "settings": FENA_SETTINGS,
        "text": "Help! Wow! Thank you, Gildong!",
    },
    {
        "id": "misspell_bus_sub",
        "file": "misspell_bus_sub.mp3",
        "voice_id": VOICE_BILL,
        "voice_name": "Bill",
        "model_id": "eleven_multilingual_v2",
        "settings": BILL_SETTINGS,
        "text": "Hehe! Next time, I will change BUS into SUB!",
    },
    {
        "id": "traveler_reply_welcome",
        "file": "traveler_reply_welcome.mp3",
        "voice_id": VOICE_BILL,
        "voice_name": "Bill",
        "model_id": "eleven_multilingual_v2",
        "settings": BILL_SETTINGS,
        "text": "Haha, nice to meet you! Welcome to America!",
    },
    {
        "id": "amy_praise_great_excellent",
        "file": "amy_praise_great_excellent.mp3",
        "voice_id": VOICE_FENA,
        "voice_name": "Fena",
        "model_id": "eleven_flash_v2",
        "settings": FENA_SETTINGS,
        "text": "Great! Excellent! You did an amazing job!",
    },
    {
        "id": "phrase_i_am_okay",
        "file": "phrase_i_am_okay.mp3",
        "voice_id": VOICE_FENA,
        "voice_name": "Fena",
        "model_id": "eleven_multilingual_v2",
        "settings": FENA_SLOW_WORD_SETTINGS,
        "text": "I am okay.",
    },
    {
        "id": "pilot_good_morning",
        "file": "pilot_good_morning.mp3",
        "voice_id": VOICE_BILL,
        "voice_name": "Bill",
        "model_id": "eleven_multilingual_v2",
        "settings": BILL_SETTINGS,
        "text": "Good morning! Welcome aboard!",
    },
    {
        "id": "phrase_good_morning",
        "file": "phrase_good_morning.mp3",
        "voice_id": VOICE_FENA,
        "voice_name": "Fena",
        "model_id": "eleven_multilingual_v2",
        "settings": FENA_SLOW_WORD_SETTINGS,
        "text": "Good morning!",
    },
    {
        "id": "pilot_reply_flight",
        "file": "pilot_reply_flight.mp3",
        "voice_id": VOICE_BILL,
        "voice_name": "Bill",
        "model_id": "eleven_multilingual_v2",
        "settings": BILL_SETTINGS,
        "text": "Good morning! Have a great flight!",
    },
    {
        "id": "guard_what_is_name",
        "file": "guard_what_is_name.mp3",
        "voice_id": VOICE_BILL,
        "voice_name": "Bill",
        "model_id": "eleven_multilingual_v2",
        "settings": BILL_SETTINGS,
        "text": "Hello! What is your name?",
    },
    {
        "id": "phrase_i_am_gildong",
        "file": "phrase_i_am_gildong.mp3",
        "voice_id": VOICE_FENA,
        "voice_name": "Fena",
        "model_id": "eleven_multilingual_v2",
        "settings": FENA_SLOW_WORD_SETTINGS,
        "text": "I am Gildong.",
    },
    {
        "id": "guard_reply_welcome",
        "file": "guard_reply_welcome.mp3",
        "voice_id": VOICE_BILL,
        "voice_name": "Bill",
        "model_id": "eleven_multilingual_v2",
        "settings": BILL_SETTINGS,
        "text": "Nice to meet you, Gildong! Welcome!",
    },
    {
        "id": "cafe_want_apple",
        "file": "cafe_want_apple.mp3",
        "voice_id": VOICE_FENA,
        "voice_name": "Fena",
        "model_id": "eleven_multilingual_v2",
        "settings": FENA_SETTINGS,
        "text": "Hello! Do you want an apple?",
    },
    {
        "id": "phrase_yes_please",
        "file": "phrase_yes_please.mp3",
        "voice_id": VOICE_FENA,
        "voice_name": "Fena",
        "model_id": "eleven_multilingual_v2",
        "settings": FENA_SLOW_WORD_SETTINGS,
        "text": "Yes, please!",
    },
    {
        "id": "cafe_reply_enjoy",
        "file": "cafe_reply_enjoy.mp3",
        "voice_id": VOICE_FENA,
        "voice_name": "Fena",
        "model_id": "eleven_flash_v2",
        "settings": FENA_SETTINGS,
        "text": "Here you go! Enjoy your apple!",
    },
    {
        "id": "kid_gift_for_you",
        "file": "kid_gift_for_you.mp3",
        "voice_id": VOICE_FENA,
        "voice_name": "Fena",
        "model_id": "eleven_flash_v2",
        "settings": FENA_SETTINGS,
        "text": "Hi! Here is a gift for you!",
    },
    {
        "id": "phrase_thank_you",
        "file": "phrase_thank_you.mp3",
        "voice_id": VOICE_FENA,
        "voice_name": "Fena",
        "model_id": "eleven_multilingual_v2",
        "settings": FENA_SLOW_WORD_SETTINGS,
        "text": "Thank you!",
    },
    {
        "id": "kid_reply_friends",
        "file": "kid_reply_friends.mp3",
        "voice_id": VOICE_FENA,
        "voice_name": "Fena",
        "model_id": "eleven_flash_v2",
        "settings": FENA_SETTINGS,
        "text": "You're welcome! Let's be friends! Bye-bye!",
    },
    {
        "id": "misspell_battle_start",
        "file": "misspell_battle_start.mp3",
        "voice_id": VOICE_BILL,
        "voice_name": "Bill",
        "model_id": "eleven_multilingual_v2",
        "settings": BILL_SETTINGS,
        "text": "Hahaha! Speak the three A words if you can! Show me your power!",
    },
    {
        "id": "misspell_hit_1",
        "file": "misspell_hit_1.mp3",
        "voice_id": VOICE_BILL,
        "voice_name": "Bill",
        "model_id": "eleven_multilingual_v2",
        "settings": BILL_SETTINGS,
        "text": "Ouch! Airplane is correct! My health is going down!",
    },
    {
        "id": "misspell_hit_2",
        "file": "misspell_hit_2.mp3",
        "voice_id": VOICE_BILL,
        "voice_name": "Bill",
        "model_id": "eleven_multilingual_v2",
        "settings": BILL_SETTINGS,
        "text": "Oh no! Apple is correct too! I only have one heart left!",
    },
    {
        "id": "misspell_defeated",
        "file": "misspell_defeated.mp3",
        "voice_id": VOICE_BILL,
        "voice_name": "Bill",
        "model_id": "eleven_multilingual_v2",
        "settings": BILL_SETTINGS,
        "text": "Nooo! Ask is correct! You defeated me! I will be back!",
    },
]

def main():
    api_key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not api_key:
        print("ERROR: ELEVENLABS_API_KEY environment variable is required.", file=sys.stderr)
        sys.exit(1)

    out_dir = os.path.join(os.path.dirname(__file__), "..", "assets", "audio", "stage1")
    os.makedirs(out_dir, exist_ok=True)

    manifest = {}
    voice_info = []

    for clip in CLIPS:
        out_path = os.path.join(out_dir, clip["file"])
        if os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
            print(f"[SKIP] {clip['file']} already exists ({os.path.getsize(out_path)} bytes)")
        else:
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{clip['voice_id']}?output_format=mp3_44100_128"
            payload = json.dumps({
                "text": clip["text"],
                "model_id": clip["model_id"],
                "voice_settings": clip["settings"],
            }).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=payload,
                headers={
                    "xi-api-key": api_key,
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg",
                },
                method="POST",
            )
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    audio_bytes = resp.read()
                with open(out_path, "wb") as f:
                    f.write(audio_bytes)
                print(f"[OK] Generated {clip['file']} ({len(audio_bytes)} bytes) — {clip['text']}")
            except urllib.error.HTTPError as e:
                err_body = e.read().decode("utf-8", errors="replace")
                print(f"[ERROR] Failed {clip['id']}: HTTP {e.code} {err_body}", file=sys.stderr)
                sys.exit(1)

        rel_url = f"assets/audio/stage1/{clip['file']}"
        manifest[clip["id"]] = {
            "id": clip["id"],
            "src": rel_url,
            "text": clip["text"],
            "voice": clip["voice_name"],
            "playbackRate": 0.85 if clip["settings"] is FENA_SLOW_WORD_SETTINGS else 1.0,
        }
        voice_info.append({
            "id": clip["id"],
            "file": clip["file"],
            "voice_id": clip["voice_id"],
            "voice_name": clip["voice_name"],
            "model_id": clip["model_id"],
            "voice_settings": clip["settings"],
            "text": clip["text"],
        })

    manifest_js_path = os.path.join(out_dir, "manifest.js")
    with open(manifest_js_path, "w", encoding="utf-8") as f:
        f.write("// Pre-generated ElevenLabs TTS Audio Manifest for Magic English Stage 1\n")
        f.write("export const STAGE1_AUDIO_MANIFEST = ")
        f.write(json.dumps(manifest, ensure_ascii=False, indent=2))
        f.write(";\n")

    info_path = os.path.join(out_dir, "voice-info.json")
    with open(info_path, "w", encoding="utf-8") as f:
        json.dump(voice_info, f, ensure_ascii=False, indent=2)

    print(f"Successfully prepared {len(CLIPS)} ElevenLabs MP3 files and manifest.js!")

if __name__ == "__main__":
    main()
