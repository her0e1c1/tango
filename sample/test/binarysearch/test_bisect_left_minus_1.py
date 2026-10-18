"""
Returns the largest index in the sorted list `sl`
where an element less than `a` exists
"""

### __FRONT_TEXT_END__
import pytest
from bisect import bisect_left


def find_largest_index(sl, a):
    return bisect_left(sl, a) - 1


@pytest.mark.parametrize(
    "args,expected",
    [
        [[sl := [1, 1, 1, 3, 4, 4, 4, 5, 6, 6], 0], -1],  # NOT FOUND
        [[sl, 1], -1],  # NOT FOUND
        [[sl, 2], 2],
        [[sl, 3], 2],
        [[sl, 4], 3],
        [[sl, 5], 6],
        [[sl, 6], 7],
        [[sl, 7], 9],
        [[sl, 12345], 9],
    ],
)
def test(args, expected):
    assert find_largest_index(*args) == expected
