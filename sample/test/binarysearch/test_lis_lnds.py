"""
Given an array of numbers, return the length of the longest non decreasing subsequence (LNDS)
in which the elements are in non decreasing order.
"""

### __FRONT_TEXT_END__
import pytest
from bisect import bisect_right


def lnds(nums):
    dp = []
    for n in nums:
        i = bisect_right(dp, n)
        if i == len(dp):
            dp.append(n)
        else:
            dp[i] = n
    return len(dp)


@pytest.mark.parametrize(
    "args,expected",
    [
        [[1], 1],
        [[1, 1, 1, 2, 2, 3], 6],
        [[3, 2, 5, 1, 3, 1, 7, 4], 3],  # [3, 5, 7]
        [[4, 2, 3, 1, 5], 3],  # [2, 3, 6]
    ],
)
def test(args, expected):
    assert lnds(args) == expected
