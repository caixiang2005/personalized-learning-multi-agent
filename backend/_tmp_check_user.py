import os
from sqlalchemy import create_engine, text

url = os.environ["DATABASE_URL"]
e = create_engine(url)
with e.connect() as c:
    users = c.execute(text(
        "select user_id, email, username, register_time from users order by user_id"
    )).mappings().all()
    print("USERS")
    for r in users:
        print(dict(r))

    cols = [x[0] for x in c.execute(text(
        "select column_name from information_schema.columns where table_name='user_info' order by ordinal_position"
    )).fetchall()]
    print("user_info_cols", cols)

    infos = c.execute(text("select * from user_info order by user_id")).mappings().all()
    print("USER_INFO")
    for r in infos:
        d = dict(r)
        for k, v in list(d.items()):
            if isinstance(v, str) and len(v) > 100:
                d[k] = v[:100] + "..."
        print(d)

    for uid in [1, 2]:
        print(f"--- user_id={uid} ---")
        for t, col in [
            ("learner_profiles", "user_id"),
            ("chat_sessions", "user_id"),
            ("chat_messages", "user_id"),
            ("learning_paths", "user_id"),
            ("daily_plans", "user_id"),
            ("learning_analytics", "user_id"),
            ("exercises", "user_id"),
        ]:
            try:
                n = c.execute(text(f"select count(*) from {t} where {col}=:u"), {"u": uid}).scalar()
                print(f"  {t}={n}")
            except Exception as ex:
                # try without user_id
                print(f"  {t} err={type(ex).__name__}: {ex}")
