def unauthorized():
    return jsonify(
        success=False,
        message=(
            "this list does not exist or you are not authorized to take this action"
        ),
    ), 401


def auth_list_permissions(user, list_id):
    user_lists = [list.id for list in user.lists]
    if list_id not in user_lists:
        return False
    return True
