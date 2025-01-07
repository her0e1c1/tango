"""
Returns True if a specified element exists in a sorted list of integers.
"""

### __FRONT_TEXT_END__
import pytest
from bisect import bisect_left


def has_element(sl, a):  # O(log(N))
    i = bisect_left(sl, a)
    return i < len(sl) and sl[i] == a


def has_element_naive(sl, a):  # O(N)
    for s in sl:
        if s == a:
            return True
    return False


@pytest.mark.parametrize(
    "args,expected",
    [
        [[(sl := [10, 30, 50]), 0], False],
        [[sl, 10], True],
        [[sl, 20], False],
        [[sl, 30], True],
        [[sl, 40], False],
        [[sl, 50], True],
        [[sl, 60], False],
    ],
)
def test(args, expected):
    assert has_element(*args) == expected
    assert has_element_naive(*args) == expected
