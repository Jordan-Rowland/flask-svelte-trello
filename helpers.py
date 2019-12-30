# def auth_user():
#     def wrapper(*args, **kwargs):
#         if "bill" in args:
#             print("Bill found")
#         func(*args, **kwargs)
#     return wrapper


# @auth_user
# def pp(name):
#     print(f"hello {name}")


# pp("nancy")
# pp("bill")


def auth_user(list_id):
    user_lists = [list.id for list in current_user.lists]
    if list_id not in user_lists:
        return (
            jsonify(
                success=False,
                message=(
                    "this list does not exist or you are not authorized to take this action"
                ),
            ),
            401,
        )
    return jsonify(success=True)
