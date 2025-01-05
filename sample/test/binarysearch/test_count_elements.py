"""
Returns the number of a specified element in a sorted array of integers.
"""

### __FRONT_TEXT_END__
import pytest
from bisect import bisect_left, bisect_right


def count_elements(sl, a):
    return bisect_right(sl, a) - bisect_left(sl, a)


@pytest.mark.parametrize(
    "args,expected",
    [
        [[(nums := [1, 1, 1, 3, 4, 4, 4, 5, 6, 6]), 0], 0],
        [[nums, 1], 3],
        [[nums, 2], 0],
        [[nums, 3], 1],
        [[nums, 4], 3],
        [[nums, 5], 1],
        [[nums, 6], 2],
        [[nums, 7], 0],
    ],
)
def test(args, expected):
    assert count_elements(*args) == expected
