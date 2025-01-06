"""
Returns True if a specified element exists in a sorted array of integers.
"""

### __FRONT_TEXT_END__
import pytest
from bisect import bisect_left


def has_element(sl, a):
    i = bisect_left(sl, a)
    return i < len(sl) and sl[i] == a


@pytest.mark.parametrize(
    "args,expected",
    [
        [[(nums := [10, 30, 50]), 0], False],
        [[nums, 10], True],
        [[nums, 20], False],
        [[nums, 30], True],
        [[nums, 40], False],
        [[nums, 50], True],
        [[nums, 60], False],
    ],
)
def test(args, expected):
    assert has_element(*args) == expected
